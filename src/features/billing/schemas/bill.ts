import { z } from "zod";

export const billItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  accountId: z.string().min(1, "Expense or Asset Account is required"), // e.g. Cost of Goods Sold, Office Supplies
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
  taxRateId: z.string().nullable().optional(),
  total: z.number().min(0),
});

export const billSchema = z.object({
  id: z.string().optional(),
  billNumber: z.string().min(1, "Bill number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  status: z.enum(["draft", "open", "paid", "overdue", "cancelled"]).default("draft"),
  
  issueDate: z.date(),
  dueDate: z.date(),
  
  items: z.array(billItemSchema).min(1, "At least one item is required"),
  
  subTotal: z.number().min(0),
  totalTax: z.number().min(0),
  grandTotal: z.number().min(0),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().optional(),
  currency: z.string().default("SAR"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type BillItem = z.infer<typeof billItemSchema>;
export type Bill = z.infer<typeof billSchema>;
export type CreateBillDTO = Omit<Bill, "id" | "createdAt" | "updatedAt">;
export type UpdateBillDTO = Partial<CreateBillDTO>;
