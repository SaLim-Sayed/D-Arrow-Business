import type { BillingSettings, TaxSettings } from "../schemas/settings";
import { DEFAULT_BILLING_CURRENCY_ENTRY } from "./billing-currency";
import { DEFAULT_TAXES } from "../data/product-defaults";

function finiteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function optionalUrl(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return undefined;
  }
}

function normalizeTaxes(taxes: TaxSettings[] | undefined): TaxSettings[] {
  const source = taxes?.length ? taxes : DEFAULT_TAXES;
  return source.map((tax) => ({
    id: tax.id,
    name: tax.name ?? "",
    rate: finiteNumber(tax.rate, 0),
    isDefault: tax.isDefault ?? false,
    isActive: tax.isActive ?? true,
  }));
}

export function prepareBillingSettingsForSave(
  data: BillingSettings
): BillingSettings {
  const profile = data.companyProfile ?? ({} as BillingSettings["companyProfile"]);

  return {
    ...data,
    companyProfile: {
      name: profile.name?.trim() ?? "",
      address: profile.address?.trim() ?? "",
      email: profile.email?.trim() ?? "",
      phone: profile.phone?.trim() || undefined,
      taxNumber: profile.taxNumber?.trim() || undefined,
      logoUrl: optionalUrl(profile.logoUrl),
      website: optionalUrl(profile.website),
    },
    currencies:
      data.currencies?.length > 0
        ? data.currencies.map((c) => ({
            code: c.code,
            symbol: c.symbol,
            name: c.name,
            isDefault: c.isDefault ?? false,
          }))
        : [{ ...DEFAULT_BILLING_CURRENCY_ENTRY }],
    taxes: normalizeTaxes(data.taxes),
    paymentMethods: (data.paymentMethods ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      details: m.details?.trim() || undefined,
      isActive: m.isActive ?? true,
    })),
    invoiceSequence: {
      prefix: data.invoiceSequence?.prefix ?? "INV-",
      nextNumber: finiteNumber(data.invoiceSequence?.nextNumber, 1),
      padding: finiteNumber(data.invoiceSequence?.padding, 4),
      suffix: data.invoiceSequence?.suffix?.trim() || undefined,
    },
    quotationSequence: data.quotationSequence
      ? {
          prefix: data.quotationSequence.prefix ?? "QUO-",
          nextNumber: finiteNumber(data.quotationSequence.nextNumber, 1),
          padding: finiteNumber(data.quotationSequence.padding, 4),
          suffix: data.quotationSequence.suffix?.trim() || undefined,
        }
      : undefined,
    estimateSequence: data.estimateSequence
      ? {
          prefix: data.estimateSequence.prefix ?? "EST-",
          nextNumber: finiteNumber(data.estimateSequence.nextNumber, 1),
          padding: finiteNumber(data.estimateSequence.padding, 4),
          suffix: data.estimateSequence.suffix?.trim() || undefined,
        }
      : undefined,
    proposalSequence: data.proposalSequence
      ? {
          prefix: data.proposalSequence.prefix ?? "PRP-",
          nextNumber: finiteNumber(data.proposalSequence.nextNumber, 1),
          padding: finiteNumber(data.proposalSequence.padding, 4),
          suffix: data.proposalSequence.suffix?.trim() || undefined,
        }
      : undefined,
    zakatSequence: {
      prefix: data.zakatSequence?.prefix ?? "ZKT-",
      nextNumber: finiteNumber(data.zakatSequence?.nextNumber, 1),
      padding: finiteNumber(data.zakatSequence?.padding, 4),
      suffix: data.zakatSequence?.suffix?.trim() || undefined,
    },
    zakatRate: finiteNumber(data.zakatRate, 2.5),
  };
}

export function normalizeBillingSettingsFromFirestore(
  settings: BillingSettings
): BillingSettings {
  return prepareBillingSettingsForSave(settings);
}
