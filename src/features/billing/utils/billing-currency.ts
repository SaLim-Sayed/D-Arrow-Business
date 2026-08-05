import type { BillingSettings } from "../schemas/settings";
import { APP_CURRENCY } from "@/lib/utils";

export const DEFAULT_BILLING_CURRENCY = APP_CURRENCY;

export const DEFAULT_BILLING_CURRENCY_ENTRY = {
  code: DEFAULT_BILLING_CURRENCY,
  symbol: "\u20C1",
  name: "Saudi Riyal",
  isDefault: true,
} as const;

/** App billing currency is always Saudi Riyal. */
export function normalizeBillingCurrency(_code?: string | null): string {
  return DEFAULT_BILLING_CURRENCY;
}

export function getDefaultBillingCurrency(
  _settings?: Pick<BillingSettings, "currencies"> | null
): string {
  return DEFAULT_BILLING_CURRENCY;
}
