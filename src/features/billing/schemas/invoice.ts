import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(), // Nullable if custom item
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be >= 0"),
  taxRate: z.number().min(0).default(0), // Percentage, e.g., 15 for 15%
  discount: z.number().min(0).default(0), // Fixed amount or percentage based on business logic (let's assume fixed amount here)
  total: z.number().min(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  customerId: z.string().min(1, "Customer is required"),
  
  issueDate: z.date(),
  dueDate: z.date(),
  
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  
  subTotal: z.number().min(0),
  totalTax: z.number().min(0),
  totalDiscount: z.number().min(0),
  grandTotal: z.number().min(0),
  amountPaid: z.number().min(0).optional(),
  
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),

  currency: z.string().default("USD"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type CreateInvoiceDTO = Omit<Invoice, "id" | "createdAt" | "updatedAt">;
export type UpdateInvoiceDTO = Partial<CreateInvoiceDTO>;
