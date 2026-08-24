import type { ZatcaInvoiceInput, ZatcaInvoiceLineInput, ZatcaPartyInput } from "./xmlBuilder";

interface InvoiceItemDoc {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  total: number;
}

interface InvoiceDoc {
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  items: InvoiceItemDoc[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  currency?: string;
}

interface CompanyProfileDoc {
  name: string;
  address: string;
  commercialRegister?: string;
  taxNumber?: string;
}

interface ContactDoc {
  firstName?: string;
  lastName?: string;
  accountName?: string;
  commercialRegister?: string;
  taxNumber?: string;
  billingAddress?: string;
}

function contactDisplayName(contact: ContactDoc | undefined, fallback: string): string {
  if (!contact) return fallback || "Customer";
  return contact.accountName?.trim() || [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || fallback || "Customer";
}

/** Mirrors src/features/billing/utils/invoice-type.ts's isBusinessBuyer — keep in sync. */
export function isBusinessBuyer(contact?: ContactDoc | null): boolean {
  if (!contact) return false;
  return Boolean(contact.commercialRegister?.trim() || contact.taxNumber?.trim());
}

export function mapInvoiceToZatcaInput(params: {
  invoiceId: string;
  invoice: InvoiceDoc;
  companyProfile: CompanyProfileDoc;
  contact?: ContactDoc | null;
  submittedAtIso: string;
}): ZatcaInvoiceInput {
  const { invoiceId, invoice, companyProfile, contact, submittedAtIso } = params;

  const seller: ZatcaPartyInput = {
    name: companyProfile.name,
    address: companyProfile.address,
    taxNumber: companyProfile.taxNumber,
    commercialRegister: companyProfile.commercialRegister,
  };

  const isB2B = isBusinessBuyer(contact ?? undefined);
  const buyer: ZatcaPartyInput | undefined =
    contact || invoice.customerName
      ? {
          name: contactDisplayName(contact ?? undefined, invoice.customerName ?? ""),
          address: contact?.billingAddress,
          taxNumber: contact?.taxNumber,
          commercialRegister: contact?.commercialRegister,
        }
      : undefined;

  const lines: ZatcaInvoiceLineInput[] = (invoice.items ?? []).map((item, idx) => ({
    id: String(idx + 1),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate ?? 0,
    discount: item.discount ?? 0,
    // Line total excl. VAT, net of discount — matches how invoice.subTotal is derived in the app.
    lineTotal: item.total,
  }));

  return {
    id: invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    issueDateTimeIso: submittedAtIso,
    currency: invoice.currency || "SAR",
    seller,
    buyer,
    lines,
    subTotal: invoice.subTotal,
    totalTax: invoice.totalTax,
    totalDiscount: invoice.totalDiscount,
    grandTotal: invoice.grandTotal,
    isB2B,
    isTaxInvoice: (invoice.totalTax ?? 0) > 0,
  };
}
