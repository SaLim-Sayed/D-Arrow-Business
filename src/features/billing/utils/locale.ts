/** Locale string for billing date/number formatting (Arabic → ar-SA). */
export function billingDateLocale(language?: string): string | undefined {
  return language?.startsWith("ar") ? "ar-SA" : undefined;
}
