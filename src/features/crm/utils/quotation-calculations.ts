import type { QuotationData, QuotationTotals } from "../types/quotation.types";

export function calculateQuotationTotals(data: QuotationData): QuotationTotals {
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  if (data.pricesIncludeVat) {
    const vatAmount = subtotal - subtotal / (1 + data.vatRate / 100);
    return {
      subtotal: subtotal - vatAmount,
      vatAmount,
      total: subtotal,
    };
  }

  const vatAmount = subtotal * (data.vatRate / 100);
  return {
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
  };
}

export function formatQuoteNumber(seq?: number): string {
  const n = seq ?? Math.floor(Date.now() / 1000) % 100000;
  return String(n).padStart(5, "0");
}

export function formatQuotationDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export function toQuotationDateIso(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatQuotationDateFromIso(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return formatQuotationDate();
  return `${y}/${m}/${d}`;
}

/** Normalize Arabic-Indic / Persian digits to Western digits for price parsing */
export function normalizePriceDigits(raw: string): string {
  let result = "";
  for (const char of raw) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;
    if (code >= 0x30 && code <= 0x39) {
      result += char;
    } else if (code >= 0x0660 && code <= 0x0669) {
      result += String(code - 0x0660);
    } else if (code >= 0x06f0 && code <= 0x06f9) {
      result += String(code - 0x06f0);
    }
  }
  return result;
}

export function parsePriceInput(raw: string): number {
  const digits = normalizePriceDigits(raw);
  return digits ? Number(digits) : 0;
}

export function formatPriceDisplay(value: number): string {
  if (value <= 0) return "";
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
