import { z } from "zod";

export const voucherTypeSchema = z.enum(["receipt", "disbursement"]);

export const voucherSchema = z.object({
  id: z.string().optional(),
  /** Receipt (سند قبض) is company income; disbursement (سند صرف) is purchases. */
  voucherType: voucherTypeSchema,
  voucherNumber: z.string().min(1),
  date: z.date(),
  amount: z.number().positive(),
  currency: z.string().default("SAR"),
  methodName: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  partyId: z.string().optional(),
  partyName: z.string().min(1),
  invoiceId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  billId: z.string().optional(),
  billNumber: z.string().optional(),
  paymentId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type VoucherType = z.infer<typeof voucherTypeSchema>;
export type Voucher = z.infer<typeof voucherSchema>;
export type CreateVoucherDTO = Omit<Voucher, "id" | "createdAt" | "updatedAt">;

export function voucherListPath(type: VoucherType) {
  return type === "receipt"
    ? "/billing/receipt-vouchers"
    : "/billing/payment-vouchers";
}

export function voucherDetailPath(type: VoucherType, id: string) {
  return `${voucherListPath(type)}/${id}`;
}

export function voucherNewPath(type: VoucherType) {
  return `${voucherListPath(type)}/new`;
}
