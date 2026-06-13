import { useTranslation } from "react-i18next";

export type QuotationLocale = "ar" | "en";

export function resolveQuotationLocale(language: string): QuotationLocale {
  return language === "ar" || language.startsWith("ar") ? "ar" : "en";
}

export function useQuotationLayout() {
  const { t, i18n } = useTranslation("crm");
  const locale = resolveQuotationLocale(i18n.language);
  const isAr = locale === "ar";

  return {
    locale,
    isAr,
    dir: isAr ? ("rtl" as const) : ("ltr" as const),
    align: isAr ? ("right" as const) : ("left" as const),
    oppositeAlign: isAr ? ("left" as const) : ("right" as const),
    bulletPad: isAr
      ? { paddingRight: "16px", paddingLeft: 0 }
      : { paddingLeft: "16px", paddingRight: 0 },
    tPdf: (key: string, options?: Record<string, unknown>) =>
      t(`quotation.pdf.${key}`, options),
  };
}

export function itemServiceName(
  item: { nameAr: string; nameEn?: string },
  locale: QuotationLocale
) {
  return locale === "ar" ? item.nameAr : item.nameEn || item.nameAr;
}

export function itemDescription(
  item: {
    descriptionAr?: string;
    descriptionEn?: string;
    description?: string;
  },
  locale: QuotationLocale
) {
  if (locale === "ar") {
    return item.descriptionAr || item.description || item.descriptionEn || "";
  }
  return item.descriptionEn || item.description || item.descriptionAr || "";
}

export function catalogItemName(
  price: { name: string; nameAr?: string | null },
  locale: QuotationLocale
) {
  if (locale === "ar") return price.nameAr?.trim() || price.name;
  return price.name;
}

export function formatQuotationTotal(
  amount: number,
  currency: string,
  includeVat: boolean,
  tPdf: (key: string) => string
) {
  const currLabel =
    currency === "SAR" ? tPdf("currencySar") : currency;
  const suffix = includeVat ? ` ${tPdf("includingVat")}` : "";
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currLabel}${suffix}`;
}
