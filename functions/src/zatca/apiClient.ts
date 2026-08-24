/**
 * Thin HTTP client for ZATCA's onboarding + clearance/reporting APIs.
 * Base URLs/paths per docs/zatca-phase2-setup.md sources. Headers
 * (Accept-Version, Accept-Language, Content-Type, OTP, Basic auth) match
 * the pattern reported consistently across independent integrations —
 * still worth a final check against the current Fatoora developer docs
 * before going live, since ZATCA has adjusted these before.
 */

import axios, { AxiosInstance } from "axios";
import { endpointsFor, ZatcaEnvironment, ZATCA_API_VERSION } from "./config";

function client(): AxiosInstance {
  return axios.create({
    headers: {
      "Content-Type": "application/json",
      "Accept-Version": ZATCA_API_VERSION,
      "Accept-Language": "en",
    },
    timeout: 30_000,
  });
}

export interface ComplianceCsidResult {
  binarySecurityToken: string;
  secret: string;
  requestId: string;
}

/** Step 1 of onboarding. `csrBase64` comes from your CSR (see functions/scripts/onboard.ts). `otp` is the one-time code from the Fatoora portal. */
export async function requestComplianceCsid(
  env: ZatcaEnvironment,
  csrBase64: string,
  otp: string
): Promise<ComplianceCsidResult> {
  const { data } = await client().post(
    endpointsFor(env).complianceCsid,
    { csr: csrBase64 },
    { headers: { OTP: otp } }
  );
  return {
    binarySecurityToken: data.binarySecurityToken,
    secret: data.secret,
    requestId: data.requestID ?? data.requestId,
  };
}

export interface ProductionCsidResult {
  binarySecurityToken: string;
  secret: string;
}

/** Step 2 of onboarding — exchange a compliance CSID for a production CSID. */
export async function requestProductionCsid(
  env: ZatcaEnvironment,
  complianceRequestId: string,
  complianceAuth: { binarySecurityToken: string; secret: string }
): Promise<ProductionCsidResult> {
  const basic = Buffer.from(`${complianceAuth.binarySecurityToken}:${complianceAuth.secret}`).toString("base64");
  const { data } = await client().post(
    endpointsFor(env).productionCsid,
    { compliance_request_id: complianceRequestId },
    { headers: { Authorization: `Basic ${basic}` } }
  );
  return { binarySecurityToken: data.binarySecurityToken, secret: data.secret };
}

export interface SubmitInvoiceResult {
  status: "REPORTED" | "CLEARED" | "REJECTED" | string;
  clearedInvoiceBase64?: string;
  warnings?: unknown[];
  errors?: unknown[];
  raw: unknown;
}

async function submit(
  url: string,
  auth: { binarySecurityToken: string; secret: string },
  body: { invoiceHash: string; uuid: string; invoice: string },
  extraHeaders?: Record<string, string>
): Promise<SubmitInvoiceResult> {
  const basic = Buffer.from(`${auth.binarySecurityToken}:${auth.secret}`).toString("base64");
  try {
    const { data } = await client().post(url, body, {
      headers: { Authorization: `Basic ${basic}`, ...extraHeaders },
    });
    return {
      status: data.clearanceStatus ?? data.reportingStatus ?? "REPORTED",
      clearedInvoiceBase64: data.clearedInvoice,
      warnings: data.validationResults?.warningMessages,
      errors: data.validationResults?.errorMessages,
      raw: data,
    };
  } catch (err: any) {
    const data = err?.response?.data;
    return {
      status: "REJECTED",
      warnings: data?.validationResults?.warningMessages,
      errors: data?.validationResults?.errorMessages ?? [err?.message ?? "Unknown ZATCA API error"],
      raw: data ?? String(err),
    };
  }
}

/** Simplified (B2C) invoices — invoice is already issued to the buyer; report async, within 24h. */
export async function reportInvoice(
  env: ZatcaEnvironment,
  auth: { binarySecurityToken: string; secret: string },
  body: { invoiceHash: string; uuid: string; invoice: string }
): Promise<SubmitInvoiceResult> {
  return submit(endpointsFor(env).reportingSingle, auth, body, { "Clearance-Status": "0" });
}

/** Standard (B2B) invoices — MUST be cleared before sharing with the buyer; synchronous. */
export async function clearInvoice(
  env: ZatcaEnvironment,
  auth: { binarySecurityToken: string; secret: string },
  body: { invoiceHash: string; uuid: string; invoice: string }
): Promise<SubmitInvoiceResult> {
  return submit(endpointsFor(env).clearanceSingle, auth, body, { "Clearance-Status": "1" });
}
