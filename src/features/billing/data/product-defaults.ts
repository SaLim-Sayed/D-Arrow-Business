import type { TaxSettings } from "../schemas/settings";

/** i18n keys stored in Firestore; labels come from products.catalog.* */
export const DEFAULT_PRODUCT_CATEGORIES = [
  { name: "electronics", description: "electronics_desc" },
  { name: "services", description: "services_desc" },
  { name: "software", description: "software_desc" },
  { name: "general", description: "general_desc" },
] as const;

export const DEFAULT_PRODUCT_UNITS = [
  { name: "piece", abbreviation: "pcs" },
  { name: "hour", abbreviation: "hr" },
  { name: "kilogram", abbreviation: "kg" },
  { name: "unit", abbreviation: "unit" },
] as const;

export const DEFAULT_TAXES: TaxSettings[] = [
  {
    id: "tax_vat_15",
    name: "tax_vat_15",
    rate: 15,
    isDefault: true,
    isActive: true,
  },
  {
    id: "tax_zero",
    name: "tax_zero",
    rate: 0,
    isDefault: false,
    isActive: true,
  },
];
