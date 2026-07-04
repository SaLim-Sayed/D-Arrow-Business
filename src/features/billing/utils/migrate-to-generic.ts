/**
 * Migration utilities for transitioning from invoice-specific system
 * to the generic document system
 */

import type { Invoice, CreateInvoiceDTO } from "../schemas/invoice";
import type { GenericDocument, CreateGenericDocumentDTO } from "../schemas/generic-document";
import { invoiceToGenericDocument } from "../schemas/generic-document";
import { BillingService } from "../api/billing.service";
import { GenericDocumentService } from "../api/generic-document.service";

/**
 * Migrate a single invoice to the generic document system
 */
export async function migrateInvoiceToGeneric(
  companyId: string,
  invoice: Invoice
): Promise<GenericDocument> {
  const genericDoc = invoiceToGenericDocument(invoice);
  
  // Create the generic document
  const result = await GenericDocumentService.create(companyId, genericDoc as CreateGenericDocumentDTO);
  
  return result.data;
}

/**
 * Migrate all invoices for a company to the generic document system
 */
export async function migrateAllInvoicesToGeneric(
  companyId: string,
  options?: {
    dryRun?: boolean;
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<{ migrated: number; failed: number; errors: Array<{ id: string; error: string }> }> {
  const { dryRun = false, batchSize = 50, onProgress } = options || {};
  
  // Fetch all invoices
  const invoicesRes = await BillingService.invoices.getAll(companyId);
  const invoices = invoicesRes.data;
  
  const result = {
    migrated: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };
  
  const total = invoices.length;
  
  // Process in batches
  for (let i = 0; i < invoices.length; i += batchSize) {
    const batch = invoices.slice(i, i + batchSize);
    
    for (const invoice of batch) {
      try {
        if (!dryRun) {
          await migrateInvoiceToGeneric(companyId, invoice);
        }
        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          id: invoice.id || "unknown",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      
      if (onProgress) {
        onProgress(result.migrated + result.failed, total);
      }
    }
  }
  
  return result;
}

/**
 * Validate that a generic document can be converted back to an invoice
 */
export function validateGenericDocumentAsInvoice(doc: GenericDocument): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (doc.documentType !== "invoice") {
    errors.push("Document type must be 'invoice'");
  }
  
  if (!doc.toEntity || doc.toEntity.type !== "contact") {
    errors.push("toEntity must be of type 'contact'");
  }
  
  if (!doc.toEntity?.id) {
    errors.push("toEntity.id is required");
  }
  
  if (!doc.issueDate) {
    errors.push("issueDate is required");
  }
  
  if (!doc.items || doc.items.length === 0) {
    errors.push("At least one item is required");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a generic document from invoice data (for new invoices)
 */
export function createGenericDocumentFromInvoiceData(
  data: CreateInvoiceDTO,
  documentType: "invoice" | "quotation" | "estimate" | "proposal" = "invoice"
): CreateGenericDocumentDTO {
  return {
    documentType,
    documentNumber: data.invoiceNumber,
    status: data.status as any,
    toEntity: {
      id: data.customerId,
      type: "contact",
    },
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    postedAt: data.postedAt,
    items: data.items.map(item => ({
      ...item,
      discountType: "fixed" as const,
      optional: false,
    })),
    subTotal: data.subTotal,
    totalTax: data.totalTax,
    totalDiscount: data.totalDiscount,
    grandTotal: data.grandTotal,
    amountPaid: data.amountPaid,
    currency: data.currency,
    exchangeRate: 1,
    paymentTermDays: data.paymentTermDays,
    quotationId: data.quotationId,
    notes: data.notes,
    termsAndConditions: data.termsAndConditions,
  };
}

/**
 * Convert generic document back to invoice format
 */
export function convertGenericToInvoiceFormat(doc: GenericDocument): CreateInvoiceDTO {
  return {
    invoiceNumber: doc.documentNumber,
    status: doc.status as any,
    customerId: doc.toEntity.id,
    issueDate: doc.issueDate,
    dueDate: doc.dueDate || doc.issueDate,
    postedAt: doc.postedAt,
    items: doc.items,
    subTotal: doc.subTotal,
    totalTax: doc.totalTax,
    totalDiscount: doc.totalDiscount,
    grandTotal: doc.grandTotal,
    amountPaid: doc.amountPaid,
    currency: doc.currency,
    paymentTermDays: doc.paymentTermDays,
    quotationId: doc.quotationId,
    notes: doc.notes,
    termsAndConditions: doc.termsAndConditions,
  };
}
