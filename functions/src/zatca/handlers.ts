import * as admin from "firebase-admin";
import { randomUUID } from "crypto";

import { buildUnsignedInvoiceXml } from "./xmlBuilder";
import { signInvoiceXml, type ZatcaSigningKeys } from "./sign";
import { reserveNextChainStep, commitChainAdvance } from "./chain";
import { reportInvoice, clearInvoice, requestComplianceCsid, requestProductionCsid } from "./apiClient";
import { mapInvoiceToZatcaInput } from "./mapping";
import type { ZatcaEnvironment } from "./config";
import {
  aborted,
  failedPrecondition,
  invalidArgument,
  notFound,
  permissionDenied,
} from "./errors";

type Firestore = FirebaseFirestore.Firestore;

async function requireCompanyMember(db: Firestore, uid: string, companyId: string): Promise<{ role: string }> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.data() as { companyId?: string; role?: string } | undefined;
  if (!user || user.companyId !== companyId) {
    throw permissionDenied("Not a member of this company.");
  }
  return { role: user.role ?? "member" };
}

async function requireCompanyAdmin(db: Firestore, uid: string, companyId: string): Promise<void> {
  const { role } = await requireCompanyMember(db, uid, companyId);
  if (!["admin", "super_admin"].includes(role)) {
    throw permissionDenied("Admin role required for ZATCA onboarding actions.");
  }
}

function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function saveOnboardingSecrets(
  db: Firestore,
  uid: string,
  raw: unknown
): Promise<{ ok: true }> {
  const data = asRecord(raw);
  const companyId = asString(data.companyId);
  const privateKeyPem = asString(data.privateKeyPem);
  const publicKeyPem = asString(data.publicKeyPem);
  const certificateBase64 = asString(data.certificateBase64);
  const binarySecurityToken = asString(data.binarySecurityToken);
  const secret = asString(data.secret);
  if (!companyId || !privateKeyPem || !publicKeyPem || !certificateBase64 || !binarySecurityToken || !secret) {
    throw invalidArgument("Missing required onboarding fields.");
  }
  await requireCompanyAdmin(db, uid, companyId);

  const env: ZatcaEnvironment = (asString(data.environment) as ZatcaEnvironment | undefined) ?? "simulation";
  await db.doc(`companies/${companyId}/zatcaSecrets/${env}`).set(
    {
      privateKeyPem,
      publicKeyPem,
      certificateBase64,
      certSignatureBase64: asString(data.certSignatureBase64) ?? null,
      binarySecurityToken,
      secret,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
      savedByUid: uid,
    },
    { merge: true }
  );
  await db.doc(`companies/${companyId}/settings/billing`).set(
    { zatcaPhase2: { onboarded: true, environment: env } },
    { merge: true }
  );
  return { ok: true };
}

export async function requestComplianceCsidHandler(
  db: Firestore,
  uid: string,
  raw: unknown
): Promise<{ requestId: string }> {
  const data = asRecord(raw);
  const companyId = asString(data.companyId);
  const csrBase64 = asString(data.csrBase64);
  const otp = asString(data.otp);
  if (!companyId || !csrBase64 || !otp) {
    throw invalidArgument("companyId, csrBase64 and otp are required.");
  }
  await requireCompanyAdmin(db, uid, companyId);
  const env: ZatcaEnvironment = (asString(data.environment) as ZatcaEnvironment | undefined) ?? "simulation";

  const result = await requestComplianceCsid(env, csrBase64, otp);

  await db.doc(`companies/${companyId}/zatcaSecrets/${env}`).set(
    {
      binarySecurityToken: result.binarySecurityToken,
      secret: result.secret,
      complianceRequestId: result.requestId,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
      savedByUid: uid,
    },
    { merge: true }
  );

  return { requestId: result.requestId };
}

export async function requestProductionCsidHandler(
  db: Firestore,
  uid: string,
  raw: unknown
): Promise<{ ok: true }> {
  const data = asRecord(raw);
  const companyId = asString(data.companyId);
  if (!companyId) throw invalidArgument("companyId is required.");
  await requireCompanyAdmin(db, uid, companyId);
  const env: ZatcaEnvironment = (asString(data.environment) as ZatcaEnvironment | undefined) ?? "simulation";

  const secretSnap = await db.doc(`companies/${companyId}/zatcaSecrets/${env}`).get();
  const secretData = secretSnap.data() as
    | { binarySecurityToken?: string; secret?: string; complianceRequestId?: string }
    | undefined;
  if (!secretData?.binarySecurityToken || !secretData?.secret || !secretData?.complianceRequestId) {
    throw failedPrecondition(
      "Run zatcaRequestComplianceCsid first — missing compliance auth or requestId."
    );
  }

  const result = await requestProductionCsid(env, secretData.complianceRequestId, {
    binarySecurityToken: secretData.binarySecurityToken,
    secret: secretData.secret,
  });

  await db.doc(`companies/${companyId}/zatcaSecrets/${env}`).set(
    {
      binarySecurityToken: result.binarySecurityToken,
      secret: result.secret,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
      savedByUid: uid,
    },
    { merge: true }
  );

  return { ok: true };
}

export interface SubmitInvoiceResult {
  accepted: boolean;
  status: string;
  qrBase64?: string;
  errors?: unknown[];
  warnings?: unknown[];
}

export async function submitInvoiceHandler(
  db: Firestore,
  uid: string,
  raw: unknown
): Promise<SubmitInvoiceResult> {
  const data = asRecord(raw);
  const companyId = asString(data.companyId);
  const invoiceId = asString(data.invoiceId);
  if (!companyId || !invoiceId) {
    throw invalidArgument("companyId and invoiceId are required.");
  }
  await requireCompanyMember(db, uid, companyId);

  const [invoiceSnap, settingsSnap] = await Promise.all([
    db.doc(`companies/${companyId}/invoices/${invoiceId}`).get(),
    db.doc(`companies/${companyId}/settings/billing`).get(),
  ]);
  if (!invoiceSnap.exists) throw notFound("Invoice not found.");
  const invoice = invoiceSnap.data() as Record<string, unknown>;
  const settings = settingsSnap.data() as Record<string, unknown> | undefined;

  const zatcaSettings = settings?.zatcaPhase2 as { enabled?: boolean; environment?: ZatcaEnvironment } | undefined;
  if (!zatcaSettings?.enabled) {
    throw failedPrecondition("ZATCA Phase 2 is not enabled in Billing settings.");
  }
  const env: ZatcaEnvironment = zatcaSettings.environment ?? "simulation";

  const secretSnap = await db.doc(`companies/${companyId}/zatcaSecrets/${env}`).get();
  const keys = secretSnap.data() as
    | {
        privateKeyPem?: string;
        publicKeyPem?: string;
        certificateBase64?: string;
        certSignatureBase64?: string;
        binarySecurityToken?: string;
        secret?: string;
      }
    | undefined;
  if (!keys?.privateKeyPem || !keys.publicKeyPem || !keys.certificateBase64 || !keys.binarySecurityToken || !keys.secret) {
    throw failedPrecondition(
      `No ZATCA credentials saved for the "${env}" environment yet — complete onboarding first (see docs/zatca-phase2-setup.md).`
    );
  }

  let contact: Record<string, unknown> | null = null;
  const customerId = asString(invoice.customerId);
  if (customerId) {
    const contactSnap = await db.doc(`companies/${companyId}/contacts/${customerId}`).get();
    contact = contactSnap.exists ? (contactSnap.data() as Record<string, unknown>) : null;
  }

  const submittedAtIso = new Date().toISOString();
  const zatcaInput = mapInvoiceToZatcaInput({
    invoiceId,
    invoice: invoice as never,
    companyProfile: settings?.companyProfile as never,
    contact: contact as never,
    submittedAtIso,
  });

  const result = await db.runTransaction(async (txn) => {
    const { icv, previousInvoiceHash } = await reserveNextChainStep(db, txn, companyId);
    const uuid = asString(invoice.zatcaUuid) || randomUUID();

    const unsignedXml = buildUnsignedInvoiceXml(zatcaInput, { uuid, icv, previousInvoiceHash });

    const signingKeys: ZatcaSigningKeys = {
      privateKeyPem: keys.privateKeyPem!,
      publicKeyPem: keys.publicKeyPem!,
      certificateBase64: keys.certificateBase64!,
      certSignatureBase64: keys.certSignatureBase64 ?? undefined,
    };

    const { signedXml, invoiceHashBase64, qrBase64 } = signInvoiceXml(unsignedXml, signingKeys, {
      sellerName: zatcaInput.seller.name,
      vatNumber: zatcaInput.seller.taxNumber ?? "",
      timestampIso: submittedAtIso,
      invoiceTotal: zatcaInput.grandTotal,
      vatTotal: zatcaInput.totalTax,
    });

    const invoiceBase64 = Buffer.from(signedXml, "utf8").toString("base64");
    const auth = { binarySecurityToken: keys.binarySecurityToken!, secret: keys.secret! };
    const submission = zatcaInput.isB2B
      ? await clearInvoice(env, auth, { invoiceHash: invoiceHashBase64, uuid, invoice: invoiceBase64 })
      : await reportInvoice(env, auth, { invoiceHash: invoiceHashBase64, uuid, invoice: invoiceBase64 });

    const accepted = submission.status === "REPORTED" || submission.status === "CLEARED";
    if (accepted) {
      commitChainAdvance(db, txn, companyId, icv, invoiceHashBase64);
    }

    const invoiceRef = db.doc(`companies/${companyId}/invoices/${invoiceId}`);
    txn.set(
      invoiceRef,
      {
        zatcaUuid: uuid,
        zatcaIcv: icv,
        zatcaPreviousHash: previousInvoiceHash,
        zatcaInvoiceHash: invoiceHashBase64,
        zatcaQrPhase2: qrBase64,
        zatcaClearanceStatus: accepted ? (zatcaInput.isB2B ? "cleared" : "reported") : "failed",
        zatcaClearanceErrors: submission.errors ?? null,
        zatcaClearanceWarnings: submission.warnings ?? null,
        zatcaSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
        zatcaEnvironment: env,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { accepted, status: submission.status, errors: submission.errors, warnings: submission.warnings, qrBase64 };
  });

  if (!result.accepted) {
    throw aborted(`ZATCA rejected the invoice: ${JSON.stringify(result.errors ?? result.status)}`);
  }
  return result;
}
