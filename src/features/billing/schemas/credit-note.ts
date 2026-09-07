import { z } from "zod";

export const creditNoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "الوصف مطلوب"),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).default(0),
  costCenterId: z.string().optional(),
  total: z.number().min(0),
});

export const creditNoteSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["credit_note", "debit_note"]).default("credit_note"),
  noteNumber: z.string().min(1, "رقم الإشعار مطلوب"),
  date: z.date(),
  partnerId: z.string().optional(),
  partnerName: z.string().min(1, "اسم العميل/المورد مطلوب"),
  invoiceId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  billId: z.string().optional(),
  billNumber: z.string().optional(),
  reason: z.string().optional(),
  items: z.array(creditNoteItemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
  subTotal: z.number().min(0),
  totalTax: z.number().min(0),
  grandTotal: z.number().min(0),
  currency: z.string().default("SAR"),
  status: z.enum(["draft", "posted", "cancelled"]).default("posted"),
  postedAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CreditNoteItem = z.infer<typeof creditNoteItemSchema>;
export type CreditNote = z.infer<typeof creditNoteSchema>;
export type CreateCreditNoteDTO = Omit<CreditNote, "id" | "createdAt" | "updatedAt">;
export type UpdateCreditNoteDTO = Partial<CreateCreditNoteDTO>;
