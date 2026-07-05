import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["customer", "vendor"]).default("customer"),
  invoiceId: z.string().optional(),
  billId: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero"),
  date: z.date(),
  methodId: z.string().optional(),
  methodName: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default("SAR"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;
export type CreatePaymentDTO = Omit<Payment, "id" | "createdAt" | "updatedAt">;
