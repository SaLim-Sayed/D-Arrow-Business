import type { TFunction } from "i18next";

/** Legacy Arabic labels seeded before i18n keys were used. */
const LEGACY_CATEGORY_KEYS: Record<string, string> = {
  إلكترونيات: "electronics",
  خدمات: "services",
  برمجيات: "software",
  عام: "general",
};

const LEGACY_UNIT_KEYS: Record<string, string> = {
  قطعة: "piece",
  ساعة: "hour",
  كيلوغرام: "kilogram",
  وحدة: "unit",
};

function resolveCatalogKey(
  value: string,
  legacyMap: Record<string, string>
): string {
  return legacyMap[value] ?? value;
}

export function categoryLabel(t: TFunction, name: string): string {
  const key = resolveCatalogKey(name, LEGACY_CATEGORY_KEYS);
  return t(`products.catalog.categories.${key}`, { defaultValue: name });
}

export function unitLabel(t: TFunction, name: string): string {
  const key = resolveCatalogKey(name, LEGACY_UNIT_KEYS);
  return t(`products.catalog.units.${key}`, { defaultValue: name });
}

const LEGACY_TAX_IDS: Record<string, string> = {
  "VAT 15%": "tax_vat_15",
  "No Tax (0%)": "tax_zero",
  "Sales Tax": "tax_vat_15",
};

export function taxLabel(
  t: TFunction,
  tax: { id: string; name: string }
): string {
  const catalogId = LEGACY_TAX_IDS[tax.name] ?? tax.id;
  const byId = t(`products.catalog.taxes.${catalogId}`, { defaultValue: "" });
  if (byId) return byId;

  const byStoredName = t(`products.catalog.taxes.${tax.name}`, { defaultValue: "" });
  if (byStoredName) return byStoredName;

  return tax.name;
}

export function taxOptionLabel(
  t: TFunction,
  tax: { id: string; name: string; rate: number }
): string {
  return `${taxLabel(t, tax)} (${tax.rate}%)`;
}
