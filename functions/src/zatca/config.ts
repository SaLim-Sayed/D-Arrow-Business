/**
 * ZATCA (Fatoora) Phase 2 environment configuration.
 *
 * Endpoint paths verified against ZATCA's published integration guidance
 * (Fatoora Developer Community + ZATCA "Systems Developers" portal) as of
 * Aug 2026. ZATCA has occasionally adjusted paths/headers in the past —
 * before going live, cross-check these against the current
 * "E-Invoicing API endpoints" thread on https://zatca1.discourse.group and
 * the ComplianceEnablementToolbox docs at
 * https://zatca.gov.sa/en/E-Invoicing/SystemsDevelopers/ComplianceEnablementToolbox/Pages/DownloadSDK.aspx
 */

export type ZatcaEnvironment = "developer-portal" | "simulation" | "core";

const GATEWAY = "https://gw-fatoora.zatca.gov.sa/e-invoicing";

export interface ZatcaEndpoints {
  /** Step 1 of onboarding — exchange a CSR + OTP (from the Fatoora portal) for a compliance CSID. */
  complianceCsid: string;
  /** Optional pre-submission compliance check for a signed invoice. */
  complianceInvoices: string;
  /** Step 2 of onboarding — exchange the compliance CSID + a compliance_request_id for a production CSID. */
  productionCsid: string;
  /** Simplified (B2C) invoices — submitted *after* being shared with the buyer (async reporting, within 24h). */
  reportingSingle: string;
  /** Standard (B2B) invoices — must be cleared *before* being shared with the buyer (sync clearance). */
  clearanceSingle: string;
}

export function endpointsFor(env: ZatcaEnvironment): ZatcaEndpoints {
  // "developer-portal" = ZATCA sandbox, no real onboarding/OTP required, for local dev only.
  // "simulation" = pre-production, requires a real OTP from the Fatoora portal's simulation env.
  // "core" = production. Treat with the same care as a real payments integration.
  return {
    complianceCsid: `${GATEWAY}/${env}/compliance`,
    complianceInvoices: `${GATEWAY}/${env}/compliance/invoices`,
    productionCsid: `${GATEWAY}/${env}/production/csids`,
    reportingSingle: `${GATEWAY}/${env}/invoices/reporting/single`,
    clearanceSingle: `${GATEWAY}/${env}/invoices/clearance/single`,
  };
}

export const ZATCA_API_VERSION = "V2";

/**
 * The all-zero-derived hash ZATCA implementations commonly seed the chain with
 * for a company's very first e-invoice (no predecessor exists yet).
 *
 * ⚠️ VERIFY THIS VALUE before relying on it in production. It is reproduced
 * from third-party integration write-ups, not copied from a ZATCA PDF we
 * could machine-read in full. Confirm it against ZATCA's own "Detailed
 * Guidelines for E-Invoicing" / Data Dictionary, or simply run your first
 * real invoice through the SDK Web-Based Validator and compare — if this
 * constant is wrong, that first invoice's PIH check will fail clearly and
 * loudly rather than silently.
 */
export const ZATCA_GENESIS_PIH =
  "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2YzNDkyMQ==";
