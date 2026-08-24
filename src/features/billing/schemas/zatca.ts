import { z } from "zod";

/** "developer-portal" = ZATCA sandbox (no OTP needed, test only). "simulation" = pre-prod, real OTP. "core" = production. */
export const zatcaEnvironmentSchema = z.enum(["developer-portal", "simulation", "core"]);
export type ZatcaEnvironment = z.infer<typeof zatcaEnvironmentSchema>;

export const zatcaClearanceStatusSchema = z.enum([
  "not_submitted",
  "reported",
  "cleared",
  "failed",
]);
export type ZatcaClearanceStatus = z.infer<typeof zatcaClearanceStatusSchema>;

/** Non-secret Phase 2 configuration stored on BillingSettings. The actual
 * private key / certificate never live here — see companies/{id}/zatcaSecrets,
 * which Firestore rules block from all client access. */
export const zatcaPhase2SettingsSchema = z.object({
  enabled: z.boolean().default(false),
  environment: zatcaEnvironmentSchema.default("developer-portal"),
  onboarded: z.boolean().default(false),
});
export type ZatcaPhase2Settings = z.infer<typeof zatcaPhase2SettingsSchema>;

/** Fields written back onto an Invoice document once it's been submitted to ZATCA. */
export interface ZatcaInvoiceFields {
  zatcaUuid?: string;
  zatcaIcv?: number;
  zatcaPreviousHash?: string;
  zatcaInvoiceHash?: string;
  zatcaQrPhase2?: string;
  zatcaClearanceStatus?: ZatcaClearanceStatus;
  zatcaClearanceErrors?: unknown[] | null;
  zatcaClearanceWarnings?: unknown[] | null;
  zatcaSubmittedAt?: Date;
  zatcaEnvironment?: ZatcaEnvironment;
}
