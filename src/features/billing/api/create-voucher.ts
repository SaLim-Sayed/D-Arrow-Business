import { BillingService } from "./billing.service";
import type { Payment } from "../schemas/payment";
import type { CreateVoucherDTO, Voucher, VoucherType } from "../schemas/voucher";
import { convertTimestampsToDates } from "../utils/timestamp";

export async function createLinkedVoucher(params: {
  companyId: string;
  type: VoucherType;
  payment: Payment;
  partyName: string;
  partyId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  billId?: string;
  billNumber?: string;
}): Promise<Voucher | null> {
  const {
    companyId,
    type,
    payment,
    partyName,
    partyId,
    invoiceId,
    invoiceNumber,
    billId,
    billNumber,
  } = params;

  try {
    const voucherNumber = await BillingService.reserveVoucherNumber(
      companyId,
      type
    );
    const payload: CreateVoucherDTO = {
      voucherType: type,
      voucherNumber,
      date:
        payment.date instanceof Date
          ? payment.date
          : new Date(payment.date as unknown as string),
      amount: payment.amount,
      currency: payment.currency,
      methodName: payment.methodName,
      reference: payment.reference,
      notes: payment.notes,
      partyName: partyName.trim() || "—",
      partyId,
      invoiceId,
      invoiceNumber,
      billId,
      billNumber,
      paymentId: payment.id,
    };

    const res = await BillingService.vouchers.create(companyId, payload);
    const voucher = convertTimestampsToDates(res.data) as Voucher;

    if (payment.id && voucher.id) {
      await BillingService.payments.update(companyId, payment.id, {
        voucherId: voucher.id,
      });
    }

    return voucher;
  } catch (error) {
    console.error("Failed to create payment voucher", error);
    return null;
  }
}
