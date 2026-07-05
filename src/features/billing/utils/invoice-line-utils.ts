import type { InvoiceItem } from "../schemas/invoice";

export function invoiceLineBeforeTax(item: InvoiceItem): number {
  return Math.max(0, item.quantity * item.unitPrice - (item.discount || 0));
}

export function invoiceLineVat(item: InvoiceItem): number {
  return invoiceLineBeforeTax(item) * (item.taxRate / 100);
}

export function invoiceVatPercent(
  subTotal: number,
  totalTax: number,
  fallback = 15
): number {
  if (subTotal <= 0 || totalTax <= 0) return fallback;
  return Math.round((totalTax / subTotal) * 100);
}
