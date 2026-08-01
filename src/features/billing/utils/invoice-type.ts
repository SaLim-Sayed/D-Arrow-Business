import type { Contact } from "@/features/crm/types/contacts.types";
import type { Invoice } from "../schemas/invoice";

/** ZATCA invoice classification used for printed titles. */
export type ZatcaInvoiceKind =
  | "tax_simplified"
  | "tax_standard"
  | "simplified"
  | "standard";

/** Buyer is treated as a business (B2B) when CR or VAT is present. */
export function isBusinessBuyer(customer?: Contact | null): boolean {
  if (!customer) return false;
  const cr = customer.commercialRegister?.trim();
  const vat = customer.taxNumber?.trim();
  return Boolean(cr || vat);
}

/**
 * Resolve invoice title kind per ZATCA:
 * - Tax + B2C → Simplified Tax Invoice
 * - Tax + B2B → Tax Invoice (standard / detailed)
 * - Non-tax + B2C → Simplified Invoice
 * - Non-tax + B2B → Detailed Invoice
 */
export function resolveZatcaInvoiceKind(
  invoice: Pick<Invoice, "totalTax">,
  customer?: Contact | null
): ZatcaInvoiceKind {
  const isTax = (invoice.totalTax ?? 0) > 0;
  const isB2B = isBusinessBuyer(customer);
  if (isTax) return isB2B ? "tax_standard" : "tax_simplified";
  return isB2B ? "standard" : "simplified";
}

export function zatcaInvoiceTitleKey(
  kind: ZatcaInvoiceKind
):
  | "invoices.detail.tax_invoice_simplified"
  | "invoices.detail.tax_invoice_standard"
  | "invoices.detail.invoice_simplified"
  | "invoices.detail.invoice_standard" {
  switch (kind) {
    case "tax_simplified":
      return "invoices.detail.tax_invoice_simplified";
    case "tax_standard":
      return "invoices.detail.tax_invoice_standard";
    case "simplified":
      return "invoices.detail.invoice_simplified";
    case "standard":
      return "invoices.detail.invoice_standard";
  }
}
