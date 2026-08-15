import {
  formatQuoteNumber,
  toQuotationDateIso,
} from "./quotation-calculations";
import {
  QUOTATION_BASE_PACKAGE,
  QUOTATION_OPTIONAL_ADDONS,
} from "../constants/quotation-templates";
import type {
  LegacyQuotationFormDraft,
  QuotationDraftLine,
  QuotationFormDraft,
  QuotationValidityUnit,
} from "../types/quotation.types";
import type { ProductPrice } from "@/features/companies/types/pricing.types";
import { itemDescription } from "./quotation-direction";

export const QUOTATION_CUSTOM_SOURCE = "custom";
export const QUOTATION_BASE_SOURCE = "base";

export const QUOTATION_VALIDITY_UNITS: QuotationValidityUnit[] = [
  "day",
  "month",
];
export const DEFAULT_VALIDITY_UNIT: QuotationValidityUnit = "day";
export const DEFAULT_VALIDITY_DURATION = 30;
/** Upper bound per unit for the validity input */
export const QUOTATION_VALIDITY_MAX: Record<QuotationValidityUnit, number> = {
  day: 365,
  month: 12,
};

/** Translation key (under `quotation.pdf`) for the validity unit label */
export function validityUnitKey(
  duration: number,
  unit: QuotationValidityUnit
): "day" | "days" | "month" | "months" {
  if (unit === "day") return duration === 1 ? "day" : "days";
  return duration === 1 ? "month" : "months";
}

/** Sensible duration when switching units, kept inside that unit's range */
export function defaultDurationForUnit(unit: QuotationValidityUnit): number {
  return unit === "day" ? DEFAULT_VALIDITY_DURATION : 3;
}

/** Read validity from any draft shape, migrating pre-unit `validityMonths`. */
function resolveValidity(
  draft: Partial<QuotationFormDraft> & { validityMonths?: number }
): Pick<QuotationFormDraft, "validityDuration" | "validityUnit"> {
  if (typeof draft.validityDuration === "number") {
    return {
      validityDuration: draft.validityDuration,
      validityUnit: draft.validityUnit ?? DEFAULT_VALIDITY_UNIT,
    };
  }
  if (typeof draft.validityMonths === "number") {
    return { validityDuration: draft.validityMonths, validityUnit: "month" };
  }
  return {
    validityDuration: DEFAULT_VALIDITY_DURATION,
    validityUnit: DEFAULT_VALIDITY_UNIT,
  };
}

function newLineId(): string {
  return `line-${crypto.randomUUID()}`;
}

export function createBasePackageLine(
  overrides?: Partial<QuotationDraftLine>
): QuotationDraftLine {
  return {
    id: newLineId(),
    sourceId: QUOTATION_BASE_SOURCE,
    nameAr: QUOTATION_BASE_PACKAGE.nameAr,
    nameEn: QUOTATION_BASE_PACKAGE.nameEn,
    descriptionAr: QUOTATION_BASE_PACKAGE.descriptionAr,
    descriptionEn: QUOTATION_BASE_PACKAGE.descriptionEn,
    unitPrice: QUOTATION_BASE_PACKAGE.unitPrice,
    quantity: 1,
    ...overrides,
  };
}

export function createCustomLine(): QuotationDraftLine {
  return {
    id: newLineId(),
    sourceId: null,
    nameAr: "",
    nameEn: "",
    descriptionAr: "",
    descriptionEn: "",
    unitPrice: 0,
    quantity: 1,
  };
}

export function createLineFromCatalogOption(
  option: QuotationCatalogOption
): QuotationDraftLine {
  return applyCatalogOptionToLine(createCustomLine(), option);
}

export function createDefaultQuotationFormDraft(): QuotationFormDraft {
  return {
    quoteNumber: formatQuoteNumber(),
    quoteDateIso: toQuotationDateIso(),
    validityDuration: DEFAULT_VALIDITY_DURATION,
    validityUnit: DEFAULT_VALIDITY_UNIT,
    clientName: "",
    clientCr: "",
    recipientTitle: "mr",
    selectedContactId: "",
    lines: [createBasePackageLine()],
    notesByLocale: {},
    vatRate: 15,
    pricesIncludeVat: true,
  };
}

export function buildQuotationTitle(
  clientName: string,
  quoteNumber: string,
  fallback: string
): string {
  const label = clientName.trim() || fallback;
  return `${label} — ${quoteNumber}`;
}

function isLegacyDraft(
  draft: QuotationFormDraft | LegacyQuotationFormDraft | Record<string, unknown>
): draft is LegacyQuotationFormDraft {
  return (
    draft != null &&
    typeof draft === "object" &&
    !("lines" in draft) &&
    ("includeBase" in draft || "selectedPriceIds" in draft)
  );
}

function descForLocale(
  itemDescriptions: LegacyQuotationFormDraft["itemDescriptions"],
  id: string,
  fallback: { descriptionAr?: string; descriptionEn?: string; description?: string }
) {
  const custom = itemDescriptions[id];
  return {
    descriptionAr: custom?.ar ?? fallback.descriptionAr ?? fallback.description,
    descriptionEn: custom?.en ?? fallback.descriptionEn ?? fallback.description,
  };
}

/** Convert legacy checkbox drafts (and incomplete shapes) into `lines[]`. */
export function normalizeQuotationDraft(
  raw: QuotationFormDraft | LegacyQuotationFormDraft | Record<string, unknown>,
  catalogPrices: ProductPrice[] = []
): QuotationFormDraft {
  if (!isLegacyDraft(raw) && Array.isArray((raw as QuotationFormDraft).lines)) {
    const draft = raw as QuotationFormDraft;
    const normalized: QuotationFormDraft = {
      ...createDefaultQuotationFormDraft(),
      ...draft,
      ...resolveValidity(draft),
      lines:
        draft.lines.length > 0
          ? draft.lines.map((line) => ({
              ...createCustomLine(),
              ...line,
              id: line.id || newLineId(),
              quantity: line.quantity || 1,
            }))
          : [createBasePackageLine()],
      recipientTitle: draft.recipientTitle ?? "mr",
    };
    delete normalized.validityMonths;
    return normalized;
  }

  if (!isLegacyDraft(raw)) {
    return createDefaultQuotationFormDraft();
  }

  const legacy = raw;
  const lines: QuotationDraftLine[] = [];
  const priceById = new Map(catalogPrices.map((p) => [p.id, p]));

  if (legacy.includeBase) {
    lines.push(
      createBasePackageLine({
        unitPrice: legacy.basePrice ?? QUOTATION_BASE_PACKAGE.unitPrice,
        ...descForLocale(legacy.itemDescriptions ?? {}, "base", QUOTATION_BASE_PACKAGE),
      })
    );
  }

  for (const addonId of legacy.selectedAddonIds ?? []) {
    const match = /^addon-(\d+)$/.exec(addonId);
    const index = match ? Number(match[1]) : -1;
    const template = QUOTATION_OPTIONAL_ADDONS[index];
    if (!template) continue;
    const price = legacy.addonPrices?.[addonId] ?? template.unitPrice;
    lines.push({
      id: newLineId(),
      sourceId: addonId,
      nameAr: template.nameAr,
      nameEn: template.nameEn,
      ...descForLocale(legacy.itemDescriptions ?? {}, addonId, template),
      unitPrice: price,
      quantity: 1,
    });
  }

  for (const priceId of legacy.selectedPriceIds ?? []) {
    const price = priceById.get(priceId);
    if (!price) {
      const customDesc = legacy.itemDescriptions?.[priceId];
      lines.push({
        id: newLineId(),
        sourceId: priceId,
        nameAr: customDesc?.ar || priceId,
        nameEn: customDesc?.en || priceId,
        descriptionAr: customDesc?.ar,
        descriptionEn: customDesc?.en,
        unitPrice: 0,
        quantity: 1,
      });
      continue;
    }
    lines.push({
      id: newLineId(),
      sourceId: price.id,
      nameAr: price.nameAr || price.name,
      nameEn: price.name,
      ...descForLocale(legacy.itemDescriptions ?? {}, price.id, {
        description: price.description,
        descriptionAr: price.description,
        descriptionEn: price.description,
      }),
      unitPrice: price.unitPrice,
      quantity: 1,
    });
  }

  return {
    quoteNumber: legacy.quoteNumber || formatQuoteNumber(),
    quoteDateIso: legacy.quoteDateIso || toQuotationDateIso(),
    ...resolveValidity(legacy),
    clientName: legacy.clientName ?? "",
    clientCr: legacy.clientCr ?? "",
    recipientTitle: legacy.recipientTitle ?? "mr",
    selectedContactId: legacy.selectedContactId ?? "",
    lines: lines.length > 0 ? lines : [createBasePackageLine()],
    notesByLocale: legacy.notesByLocale ?? {},
    vatRate: legacy.vatRate ?? 15,
    pricesIncludeVat: legacy.pricesIncludeVat ?? true,
  };
}

export type QuotationCatalogOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  unitPrice: number;
  group: "base" | "catalog" | "addon" | "custom";
};

export function buildQuotationCatalogOptions(
  activePrices: ProductPrice[]
): QuotationCatalogOption[] {
  const options: QuotationCatalogOption[] = [
    {
      id: QUOTATION_BASE_SOURCE,
      nameAr: QUOTATION_BASE_PACKAGE.nameAr,
      nameEn: QUOTATION_BASE_PACKAGE.nameEn || QUOTATION_BASE_PACKAGE.nameAr,
      descriptionAr: QUOTATION_BASE_PACKAGE.descriptionAr,
      descriptionEn: QUOTATION_BASE_PACKAGE.descriptionEn,
      unitPrice: QUOTATION_BASE_PACKAGE.unitPrice,
      group: "base",
    },
    ...activePrices.map((price) => ({
      id: price.id,
      nameAr: price.nameAr || price.name,
      nameEn: price.name,
      descriptionAr: price.description,
      descriptionEn: price.description,
      unitPrice: price.unitPrice,
      group: "catalog" as const,
    })),
    ...QUOTATION_OPTIONAL_ADDONS.map((addon, i) => ({
      id: `addon-${i}`,
      nameAr: addon.nameAr,
      nameEn: addon.nameEn || addon.nameAr,
      descriptionAr: addon.descriptionAr,
      descriptionEn: addon.descriptionEn,
      unitPrice: addon.unitPrice,
      group: "addon" as const,
    })),
    {
      id: QUOTATION_CUSTOM_SOURCE,
      nameAr: "",
      nameEn: "",
      unitPrice: 0,
      group: "custom",
    },
  ];
  return options;
}

export function applyCatalogOptionToLine(
  line: QuotationDraftLine,
  option: QuotationCatalogOption
): QuotationDraftLine {
  if (option.group === "custom") {
    return {
      ...line,
      sourceId: null,
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      unitPrice: 0,
    };
  }
  return {
    ...line,
    sourceId: option.id,
    nameAr: option.nameAr,
    nameEn: option.nameEn,
    descriptionAr: option.descriptionAr,
    descriptionEn: option.descriptionEn,
    unitPrice: option.unitPrice,
  };
}

export function lineDisplayDescription(
  line: QuotationDraftLine,
  locale: "ar" | "en"
): string {
  return itemDescription(line, locale);
}

export function updateLineDescription(
  line: QuotationDraftLine,
  locale: "ar" | "en",
  value: string
): QuotationDraftLine {
  if (locale === "ar") return { ...line, descriptionAr: value };
  return { ...line, descriptionEn: value };
}

export function updateLineName(
  line: QuotationDraftLine,
  locale: "ar" | "en",
  value: string
): QuotationDraftLine {
  if (locale === "ar") return { ...line, nameAr: value };
  return { ...line, nameEn: value };
}
