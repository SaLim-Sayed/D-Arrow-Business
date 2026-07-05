import type { BillingSettings } from "../schemas/settings";

export const DEFAULT_BILLING_CURRENCY = "SAR";

export const DEFAULT_BILLING_CURRENCY_ENTRY = {
  code: DEFAULT_BILLING_CURRENCY,
  symbol: "SAR",
  name: "Saudi Riyal",
  isDefault: true,
} as const;

export function getDefaultBillingCurrency(
  settings?: Pick<BillingSettings, "currencies"> | null
): string {
  return (
    settings?.currencies?.find((c) => c.isDefault)?.code ??
    DEFAULT_BILLING_CURRENCY
  );
}
