import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { getAppOrigin } from "@/lib/constants";
import { withLogging } from "@/lib/service-utils";
import type { Invoice } from "../schemas/invoice";
import type { BillingSettings } from "../schemas/settings";
import type { CompanyProfile } from "@/features/companies/types/company.types";
import type { Contact } from "@/features/crm/types/contacts.types";
import { resolveInvoiceCustomerName } from "../utils/invoice-customer";
import { getInvoiceAmountDue } from "../utils/accounting-engine";

const SERVICE = "InvoiceShareService";
const MAX_BASE64_CHARS = 700_000;

/** Lightweight printable invoice payload for public /i/:token (no auth). */
export interface InvoicePublicSnapshot {
  invoice: Omit<Invoice, "issueDate" | "dueDate" | "postedAt" | "createdAt" | "updatedAt"> & {
    issueDate: string;
    dueDate: string;
    postedAt?: string;
  };
  amountDue: number;
  customerName: string;
  customer?: {
    email?: string;
    phone?: string;
    taxNumber?: string;
    commercialRegister?: string;
    billingAddress?: string;
    accountName?: string;
  };
  company: {
    name: string;
    address?: string;
    commercialRegister?: string;
    taxNumber?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
}

export interface InvoicePublicShare {
  token: string;
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  snapshot?: InvoicePublicSnapshot;
  pdfUrl?: string;
  pdfBase64?: string;
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

function toIso(value: Date | string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function buildInvoicePublicSnapshot(input: {
  invoice: Invoice;
  settings?: BillingSettings;
  company?: CompanyProfile | null;
  customer?: Contact;
}): InvoicePublicSnapshot {
  const { invoice, settings, company, customer } = input;
  const profile = settings?.companyProfile;
  const customerName = resolveInvoiceCustomerName(
    invoice,
    customer ? [customer] : [],
    invoice.customerName || "—"
  );

  const {
    createdAt: _c,
    updatedAt: _u,
    ...invoiceFields
  } = invoice;

  return stripUndefined({
    invoice: {
      ...invoiceFields,
      issueDate: toIso(invoice.issueDate) || new Date().toISOString(),
      dueDate: toIso(invoice.dueDate) || new Date().toISOString(),
      postedAt: toIso(invoice.postedAt),
    },
    amountDue: getInvoiceAmountDue(invoice),
    customerName,
    customer: customer
      ? {
          email: customer.email,
          phone: customer.phone,
          taxNumber: customer.taxNumber,
          commercialRegister: customer.commercialRegister,
          billingAddress: customer.billingAddress,
          accountName: customer.accountName,
        }
      : undefined,
    company: {
      name:
        profile?.name ||
        company?.legalName ||
        company?.name ||
        "—",
      address: profile?.address || company?.address,
      commercialRegister:
        profile?.commercialRegister || company?.commercialRegister,
      taxNumber: profile?.taxNumber || company?.taxNumber,
      phone: profile?.phone || company?.phone,
      email: profile?.email || company?.email,
      logoUrl: profile?.logoUrl,
    },
  }) as InvoicePublicSnapshot;
}

/** Firestore rejects `undefined` in nested objects. */
function stripUndefined<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined) continue;
    out[key] = stripUndefined(v);
  }
  return out as T;
}

export function hydrateInvoiceFromSnapshot(
  snapshot: InvoicePublicSnapshot
): {
  invoice: Invoice;
  customer?: Contact;
  company: CompanyProfile;
  amountDue: number;
} {
  const raw = snapshot.invoice;
  const invoice: Invoice = {
    ...raw,
    issueDate: new Date(raw.issueDate),
    dueDate: new Date(raw.dueDate),
    postedAt: raw.postedAt ? new Date(raw.postedAt) : undefined,
  };

  const customer = snapshot.customer
    ? ({
        id: invoice.customerId || "public",
        firstName: snapshot.customerName,
        lastName: "",
        email: snapshot.customer.email || "",
        phone: snapshot.customer.phone || "",
        accountName: snapshot.customer.accountName,
        taxNumber: snapshot.customer.taxNumber,
        commercialRegister: snapshot.customer.commercialRegister,
        billingAddress: snapshot.customer.billingAddress,
        ownerId: null,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Contact)
    : undefined;

  const company: CompanyProfile = {
    id: "public",
    name: snapshot.company.name,
    legalName: snapshot.company.name,
    address: snapshot.company.address,
    commercialRegister: snapshot.company.commercialRegister || "",
    taxNumber: snapshot.company.taxNumber,
    phone: snapshot.company.phone,
    email: snapshot.company.email,
    defaultCurrency: "SAR",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    invoice,
    customer,
    company,
    amountDue: snapshot.amountDue,
  };
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

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToPdfBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

async function uploadInvoicePdf(
  companyId: string,
  invoiceId: string,
  shareToken: string,
  blob: Blob
): Promise<string | null> {
  const path = `invoice-pdfs/${companyId}/${invoiceId}/${shareToken}.pdf`;
  const bucket = storage.app.options.storageBucket;
  if (!bucket) return null;

  try {
    const idToken = await auth.currentUser?.getIdToken();
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: blob,
    });
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    const downloadToken = data.downloadTokens as string | undefined;
    if (downloadToken) {
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
    }
  } catch {
    /* try SDK */
  }

  try {
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: "application/pdf" });
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}

export async function upsertInvoicePublicShare(
  input: Partial<InvoicePublicShare> & {
    token: string;
    companyId: string;
    invoiceId: string;
    invoiceNumber: string;
  }
): Promise<void> {
  return withLogging(SERVICE, "upsertInvoicePublicShare", (async () => {
    const payload: Record<string, unknown> = {
      token: input.token,
      companyId: input.companyId,
      invoiceId: input.invoiceId,
      invoiceNumber: input.invoiceNumber,
      updatedAt: serverTimestamp(),
    };
    if (input.snapshot) payload.snapshot = input.snapshot;
    if (input.pdfUrl) payload.pdfUrl = input.pdfUrl;
    if (input.pdfBase64) payload.pdfBase64 = input.pdfBase64;

    await setDoc(doc(db, "publicInvoiceShares", input.token), payload, {
      merge: true,
    });
  })());
}

/** Fast publish: snapshot only (works without Storage; QR opens immediately). */
export async function publishInvoiceSnapshotShare(input: {
  companyId: string;
  invoice: Invoice;
  shareToken: string;
  settings?: BillingSettings;
  company?: CompanyProfile | null;
  customer?: Contact;
}): Promise<{ shareUrl: string }> {
  const snapshot = buildInvoicePublicSnapshot(input);
  await upsertInvoicePublicShare({
    token: input.shareToken,
    companyId: input.companyId,
    invoiceId: input.invoice.id!,
    invoiceNumber: input.invoice.invoiceNumber,
    snapshot,
  });
  return { shareUrl: invoicePdfShareUrl(input.shareToken) };
}

/** Optional: attach PDF bytes/URL after snapshot is already public. */
export async function publishInvoicePdfShare(input: {
  companyId: string;
  invoice: Invoice;
  printElement: HTMLElement;
  shareToken: string;
  settings?: BillingSettings;
  company?: CompanyProfile | null;
  customer?: Contact;
}): Promise<{ pdfUrl: string; shareUrl: string }> {
  // Always ensure snapshot first so the link never says "not ready"
  await publishInvoiceSnapshotShare(input);

  const { generatePdfBlob } = await import(
    "@/features/crm/utils/generate-quotation-pdf"
  );
  const blob = await generatePdfBlob(input.printElement);

  const storageUrl = await uploadInvoicePdf(
    input.companyId,
    input.invoice.id!,
    input.shareToken,
    blob
  );

  let pdfBase64: string | undefined;
  try {
    const b64 = await blobToBase64(blob);
    if (b64.length <= MAX_BASE64_CHARS) pdfBase64 = b64;
  } catch {
    /* ignore */
  }

  if (storageUrl || pdfBase64) {
    await upsertInvoicePublicShare({
      token: input.shareToken,
      companyId: input.companyId,
      invoiceId: input.invoice.id!,
      invoiceNumber: input.invoice.invoiceNumber,
      pdfUrl: storageUrl ?? undefined,
      pdfBase64,
    });
  }

  return {
    pdfUrl: storageUrl || `snapshot:${input.shareToken}`,
    shareUrl: invoicePdfShareUrl(input.shareToken),
  };
}
