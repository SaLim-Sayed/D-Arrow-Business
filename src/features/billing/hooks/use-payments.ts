import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Payment, CreatePaymentDTO } from "../schemas/payment";
import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";
import {
  buildPaymentJournalEntry,
  buildVendorPaymentJournalEntry,
  getInvoiceAmountDue,
} from "../utils/accounting-engine";
import { getBillAmountDue } from "../utils/aged-reports";

type PaymentFilter =
  | string
  | {
      invoiceId?: string;
      billId?: string;
    };

function resolvePaymentFilter(filter?: PaymentFilter) {
  if (typeof filter === "string") {
    return { invoiceId: filter, billId: undefined };
  }
  return {
    invoiceId: filter?.invoiceId,
    billId: filter?.billId,
  };
}

export function usePayments(filter?: PaymentFilter) {
  const { companyId } = useCompany();
  const { invoiceId, billId } = resolvePaymentFilter(filter);

  return useQuery({
    queryKey: ["billing", "payments", companyId, invoiceId, billId],
    queryFn: async () => {
      const res = await BillingService.payments.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as Payment[];
      if (invoiceId) return data.filter((p) => p.invoiceId === invoiceId);
      if (billId) return data.filter((p) => p.billId === billId);
      return data;
    },
    enabled: !!companyId,
  });
}

export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({
      invoice,
      payment,
    }: {
      invoice: Invoice;
      payment: Omit<CreatePaymentDTO, "invoiceId" | "type" | "currency">;
    }) => {
      const amountDue = getInvoiceAmountDue(invoice);
      if (payment.amount > amountDue + 0.001) {
        throw new Error("Payment exceeds amount due");
      }

      const paymentRes = await BillingService.payments.create(companyId!, {
        ...payment,
        type: "customer",
        invoiceId: invoice.id,
        currency: invoice.currency,
      });
      const savedPayment = convertTimestampsToDates(
        paymentRes.data
      ) as Payment;

      const accountsRes = await BillingService.accounts.getAll(companyId!);
      const journal = buildPaymentJournalEntry(
        savedPayment,
        invoice,
        accountsRes.data
      );
      await BillingService.postJournalWithBalances(companyId!, journal);

      const newPaid = (invoice.amountPaid ?? 0) + payment.amount;
      const newStatus =
        newPaid >= invoice.grandTotal - 0.001 ? "paid" : invoice.status;

      await BillingService.invoices.update(companyId!, invoice.id!, {
        amountPaid: newPaid,
        status: newStatus,
      });

      return savedPayment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["billing", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({
        queryKey: ["billing", "invoices", variables.invoice.id],
      });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useRecordVendorPaymentMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({
      bill,
      payment,
    }: {
      bill: Bill;
      payment: Omit<CreatePaymentDTO, "billId" | "type" | "currency">;
    }) => {
      const amountDue = getBillAmountDue(bill);
      if (payment.amount > amountDue + 0.001) {
        throw new Error("Payment exceeds amount due");
      }

      const paymentRes = await BillingService.payments.create(companyId!, {
        ...payment,
        type: "vendor",
        billId: bill.id,
        currency: bill.currency,
      });
      const savedPayment = convertTimestampsToDates(
        paymentRes.data
      ) as Payment;

      const accountsRes = await BillingService.accounts.getAll(companyId!);
      const journal = buildVendorPaymentJournalEntry(
        savedPayment,
        bill,
        accountsRes.data
      );
      await BillingService.postJournalWithBalances(companyId!, journal);

      const newPaid = (bill.amountPaid ?? 0) + payment.amount;
      const newStatus =
        newPaid >= bill.grandTotal - 0.001 ? "paid" : bill.status;

      await BillingService.bills.update(companyId!, bill.id!, {
        amountPaid: newPaid,
        status: newStatus,
      });

      return savedPayment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["billing", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "bills"] });
      queryClient.invalidateQueries({
        queryKey: ["billing", "bills", variables.bill.id],
      });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
