import { auth } from "@/lib/firebase";
import type { ZatcaEnvironment } from "../schemas/zatca";

export interface SubmitInvoiceResponse {
  accepted: boolean;
  status: string;
  qrBase64?: string;
  errors?: unknown[];
  warnings?: unknown[];
}

class ZatcaApiError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ZatcaApiError";
    this.code = code;
  }
}

async function zatcaPost<T>(action: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ZatcaApiError("Sign in required.", "unauthenticated");
  const token = await user.getIdToken();
  const res = await fetch(`/api/zatca/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as { error?: string; code?: string } & T;
  if (!res.ok) {
    throw new ZatcaApiError(payload.error || `ZATCA request failed (${res.status})`, payload.code);
  }
  return payload;
}

/** Signs + submits one invoice to ZATCA (Clearance for B2B, Reporting for B2C). */
export async function submitInvoiceToZatca(
  companyId: string,
  invoiceId: string
): Promise<SubmitInvoiceResponse> {
  return zatcaPost<SubmitInvoiceResponse>("submit", { companyId, invoiceId });
}

/** Step 1 of onboarding — exchange a CSR + Fatoora-portal OTP for a compliance CSID. Admin-only. */
export async function requestZatcaComplianceCsid(params: {
  companyId: string;
  environment: ZatcaEnvironment;
  csrBase64: string;
  otp: string;
}): Promise<{ requestId: string }> {
  return zatcaPost<{ requestId: string }>("compliance-csid", params);
}

/** Step 2 of onboarding — exchange the compliance CSID for a production CSID. Admin-only. */
export async function requestZatcaProductionCsid(params: {
  companyId: string;
  environment: ZatcaEnvironment;
}): Promise<{ ok: boolean }> {
  return zatcaPost<{ ok: boolean }>("production-csid", params);
}

/** Persists a keypair/certificate obtained via functions/scripts/onboard.ts + onboarding calls above. Admin-only. */
export async function saveZatcaOnboardingSecrets(params: {
  companyId: string;
  environment: ZatcaEnvironment;
  privateKeyPem: string;
  publicKeyPem: string;
  certificateBase64: string;
  certSignatureBase64?: string;
  binarySecurityToken: string;
  secret: string;
}): Promise<{ ok: boolean }> {
  return zatcaPost<{ ok: boolean }>("save-secrets", params);
}
