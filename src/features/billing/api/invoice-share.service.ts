import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { getAppOrigin } from "@/lib/constants";
import { withLogging } from "@/lib/service-utils";
import type { Invoice } from "../schemas/invoice";

const SERVICE = "InvoiceShareService";

export interface InvoicePublicShare {
  token: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl: string;
  updatedAt?: unknown;
}

export function createInvoiceShareToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function invoicePdfShareUrl(shareToken: string): string {
  return `${getAppOrigin()}/i/${shareToken}`;
}

export async function getInvoicePublicShare(
  token: string
): Promise<InvoicePublicShare | null> {
  return withLogging(SERVICE, "getInvoicePublicShare", (async () => {
    const snap = await getDoc(doc(db, "publicInvoiceShares", token));
    if (!snap.exists()) return null;
    return snap.data() as InvoicePublicShare;
  })());
}

export async function uploadInvoicePdf(
  companyId: string,
  invoiceId: string,
  shareToken: string,
  blob: Blob
): Promise<string> {
  return withLogging(SERVICE, "uploadInvoicePdf", (async () => {
    const path = `invoice-pdfs/${companyId}/${invoiceId}/${shareToken}.pdf`;
    const bucket = storage.app.options.storageBucket;
    const file = new File([blob], `${shareToken}.pdf`, {
      type: "application/pdf",
    });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: file,
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      const downloadToken = data.downloadTokens as string | undefined;
      if (downloadToken) {
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
      }
    } catch {
      // fall through to SDK
    }

    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: "application/pdf" });
    return getDownloadURL(storageRef);
  })());
}

export async function upsertInvoicePublicShare(input: {
  token: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl: string;
}): Promise<void> {
  return withLogging(SERVICE, "upsertInvoicePublicShare", (async () => {
    await setDoc(
      doc(db, "publicInvoiceShares", input.token),
      {
        token: input.token,
        companyId: input.companyId,
        invoiceId: input.invoiceId,
        invoiceNumber: input.invoiceNumber,
        pdfUrl: input.pdfUrl,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  })());
}

export async function publishInvoicePdfShare(input: {
  companyId: string;
  invoice: Invoice;
  printElement: HTMLElement;
  shareToken: string;
}): Promise<{ pdfUrl: string; shareUrl: string }> {
  const { generatePdfBlob } = await import(
    "@/features/crm/utils/generate-quotation-pdf"
  );
  const blob = await generatePdfBlob(input.printElement);
  const pdfUrl = await uploadInvoicePdf(
    input.companyId,
    input.invoice.id!,
    input.shareToken,
    blob
  );
  await upsertInvoicePublicShare({
    token: input.shareToken,
    companyId: input.companyId,
    invoiceId: input.invoice.id!,
    invoiceNumber: input.invoice.invoiceNumber,
    pdfUrl,
  });
  return {
    pdfUrl,
    shareUrl: invoicePdfShareUrl(input.shareToken),
  };
}
