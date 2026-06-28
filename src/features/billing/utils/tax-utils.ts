import type { TaxSettings } from "../schemas/settings";

export const SYSTEM_TAX_IDS = new Set(["tax_vat_15", "tax_zero"]);

export function isSystemTax(id: string): boolean {
  return SYSTEM_TAX_IDS.has(id);
}

export function getActiveTaxes(taxes: TaxSettings[] = []): TaxSettings[] {
  return taxes.filter((tax) => tax.isActive !== false);
}

export function getDefaultTax(taxes: TaxSettings[] = []): TaxSettings | undefined {
  const active = getActiveTaxes(taxes);
  return active.find((t) => t.isDefault) ?? active[0];
}

export function getTaxById(
  taxes: TaxSettings[] = [],
  id?: string | null
): TaxSettings | undefined {
  if (!id) return undefined;
  return taxes.find((t) => t.id === id);
}

export function getTaxRateForProduct(
  taxes: TaxSettings[] = [],
  taxRateId?: string | null
): number {
  const tax = getTaxById(taxes, taxRateId);
  if (tax) return tax.rate;
  return getDefaultTax(taxes)?.rate ?? 0;
}

/** Ensure exactly one default among active taxes before save. */
export function normalizeTaxesForSave(taxes: TaxSettings[]): TaxSettings[] {
  if (taxes.length === 0) return taxes;

  const withDefaults = taxes.map((tax) => ({
    ...tax,
    isActive: tax.isActive ?? true,
  }));

  const active = withDefaults.filter((t) => t.isActive !== false);
  let defaultId = active.find((t) => t.isDefault)?.id;

  if (!defaultId && active.length > 0) {
    defaultId = active[0].id;
  }

  return withDefaults.map((tax) => ({
    ...tax,
    isDefault: tax.id === defaultId && tax.isActive !== false,
  }));
}
