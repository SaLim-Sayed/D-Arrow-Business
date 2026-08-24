import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(), // Nullable if custom item
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be >= 0"),
  taxRate: z.number().min(0).default(0),
  taxRateId: z.string().nullable().optional(),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
});

export const invoiceSchema = z
  .object({
    id: z.string().optional(),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    status: z.enum(["draft", "pending", "sent", "paid", "overdue", "cancelled"]).default("draft"),
    /** Linked CRM contact — set when picking existing or after creating from typed name. */
    customerId: z.string().optional().default(""),
    /** Display / typed company-or-customer name (works without selecting from the list). */
    customerName: z.string().optional(),

    issueDate: z.date(),
    dueDate: z.date(),

    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),

    subTotal: z.number().min(0),
    totalTax: z.number().min(0),
    totalDiscount: z.number().min(0),
    grandTotal: z.number().min(0),
    amountPaid: z.number().min(0).optional(),
    quotationId: z.string().optional(),
    paymentTermDays: z.number().int().min(0).optional(),
    postedAt: z.date().optional(),

    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),

    currency: z.string().default("SAR"),
    /** Public token for /i/:token → opens PDF when scanned */
    shareToken: z.string().optional(),
    /** Firebase Storage download URL for the shared PDF */
    pdfUrl: z.string().optional(),
    /** Pending until an admin, manager, or super admin approves print/send. */
    approvalStatus: z.enum(["pending", "approved"]).optional(),
    approvedAt: z.date().optional().nullable(),
    approvedBy: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.customerId?.trim() && !data.customerName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Customer is required",
        path: ["customerId"],
      });
    }
  });

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type CreateInvoiceDTO = Omit<Invoice, "id" | "createdAt" | "updatedAt">;
export type UpdateInvoiceDTO = Partial<CreateInvoiceDTO>;
