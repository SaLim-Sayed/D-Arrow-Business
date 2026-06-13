import {
  formatQuoteNumber,
  toQuotationDateIso,
} from "./quotation-calculations";
import type { QuotationFormDraft } from "../types/quotation.types";

export function createDefaultQuotationFormDraft(): QuotationFormDraft {
  return {
    quoteNumber: formatQuoteNumber(),
    quoteDateIso: toQuotationDateIso(),
    validityMonths: 3,
    clientName: "",
    clientCr: "",
    recipientTitle: "mr",
    selectedContactId: "",
    includeBase: true,
    basePrice: 9000,
    selectedPriceIds: [],
    selectedAddonIds: [],
    addonPrices: {},
    itemDescriptions: {},
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
