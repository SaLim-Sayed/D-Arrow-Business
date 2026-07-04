import { z } from "zod";

/**
 * Generic entity reference system
 * Allows documents to reference different types of entities
 */
export const entityTypeSchema = z.enum([
  "contact",
  "company",
  "project",
  "lead",
  "deal",
  "vendor",
  "employee",
]);

export type EntityType = z.infer<typeof entityTypeSchema>;

export const entityReferenceSchema = z.object({
  id: z.string(),
  type: entityTypeSchema,
  name: z.string().optional(),
});

export type EntityReference = z.infer<typeof entityReferenceSchema>;

/**
 * Document types that can be handled by the generic system
 */
export const documentTypeSchema = z.enum([
  "invoice",
  "quotation",
  "estimate",
  "proposal",
  "sales_order",
  "purchase_order",
  "receipt",
  "credit_note",
  "debit_note",
]);

export type DocumentType = z.infer<typeof documentTypeSchema>;

/**
 * Generic document status
 * More flexible than invoice-specific statuses
 */
export const documentStatusSchema = z.enum([
  "draft",
  "pending",
  "sent",
  "accepted",
  "rejected",
  "paid",
  "partial",
  "overdue",
  "cancelled",
  "completed",
]);

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

/**
 * Generic line item schema
 * Works across all document types
 */
export const genericLineItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be >= 0"),
  taxRate: z.number().min(0).default(0),
  taxRateId: z.string().nullable().optional(),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["percentage", "fixed"]).default("fixed"),
  total: z.number().min(0),
  optional: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type GenericLineItem = z.infer<typeof genericLineItemSchema>;

/**
 * Generic document schema
 * Can represent invoices, quotations, estimates, proposals, etc.
 */
export const genericDocumentSchema = z.object({
  id: z.string().optional(),
  
  // Document identification
  documentType: documentTypeSchema,
  documentNumber: z.string().min(1, "Document number is required"),
  status: documentStatusSchema.default("draft"),
  
  // Entity references (replaces customerId)
  fromEntity: entityReferenceSchema.optional(), // Who is sending the document
  toEntity: entityReferenceSchema, // Who is receiving the document
  relatedEntity: entityReferenceSchema.optional(), // Related entity (e.g., project, deal)
  
  // Dates
  issueDate: z.date(),
  validUntil: z.date().optional(),
  dueDate: z.date().optional(),
  postedAt: z.date().optional(),
  
  // Line items
  items: z.array(genericLineItemSchema).min(1, "At least one item is required"),
  
  // Financials
  subTotal: z.number().min(0),
  totalTax: z.number().min(0),
  totalDiscount: z.number().min(0),
  grandTotal: z.number().min(0),
  amountPaid: z.number().min(0).optional(),
  amountDue: z.number().min(0).optional(),
  
  // Currency
  currency: z.string().default("USD"),
  exchangeRate: z.number().default(1),
  
  // Terms
  paymentTermDays: z.number().int().min(0).optional(),
  paymentTerms: z.string().optional(),
  
  // References to other documents
  quotationId: z.string().optional(),
  invoiceId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  parentDocumentId: z.string().optional(),
  
  // Notes and terms
  notes: z.string().optional(),
  notesAr: z.string().optional(),
  notesEn: z.string().optional(),
  termsAndConditions: z.string().optional(),
  termsAndConditionsAr: z.string().optional(),
  termsAndConditionsEn: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
  
  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type GenericDocument = z.infer<typeof genericDocumentSchema>;
export type CreateGenericDocumentDTO = Omit<
  GenericDocument,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateGenericDocumentDTO = Partial<CreateGenericDocumentDTO>;

/**
 * Helper function to convert Invoice to GenericDocument
 */
export function invoiceToGenericDocument(invoice: {
  invoiceNumber: string;
  status: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  postedAt?: Date;
  items: any[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  amountPaid?: number;
  currency: string;
  paymentTermDays?: number;
  quotationId?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): GenericDocument {
  return {
    documentType: "invoice" as const,
    documentNumber: invoice.invoiceNumber,
    status: invoice.status as DocumentStatus,
    toEntity: {
      id: invoice.customerId,
      type: "contact",
    },
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    postedAt: invoice.postedAt,
    items: invoice.items,
    subTotal: invoice.subTotal,
    totalTax: invoice.totalTax,
    totalDiscount: invoice.totalDiscount,
    grandTotal: invoice.grandTotal,
    amountPaid: invoice.amountPaid,
    currency: invoice.currency,
    exchangeRate: 1,
    paymentTermDays: invoice.paymentTermDays,
    quotationId: invoice.quotationId,
    notes: invoice.notes,
    termsAndConditions: invoice.termsAndConditions,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

/**
 * Helper function to convert GenericDocument to Invoice
 */
export function genericDocumentToInvoice(doc: GenericDocument): {
  invoiceNumber: string;
  status: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  postedAt?: Date;
  items: any[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  amountPaid?: number;
  currency: string;
  paymentTermDays?: number;
  quotationId?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt?: Date;
  updatedAt?: Date;
} {
  return {
    invoiceNumber: doc.documentNumber,
    status: doc.status,
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
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
