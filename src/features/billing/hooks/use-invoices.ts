import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invoice, CreateInvoiceDTO, UpdateInvoiceDTO } from "../schemas/invoice";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";
import {
  buildInvoiceJournalEntry,
  syncInvoiceStatuses,
} from "../utils/accounting-engine";

async function postInvoiceIfNeeded(
  companyId: string,
  invoice: Invoice,
  wasDraft: boolean
) {
  if (!wasDraft) return;
  if (invoice.status !== "sent" && invoice.status !== "paid") return;

  const accountsRes = await BillingService.accounts.getAll(companyId);
  const journal = buildInvoiceJournalEntry(invoice, accountsRes.data);
  await BillingService.postJournalWithBalances(companyId, journal);
}

export function useInvoices() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "invoices", companyId],
    queryFn: async () => {
      const res = await BillingService.invoices.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as Invoice[];
      const sorted = data.sort(
        (a, b) => b.issueDate.getTime() - a.issueDate.getTime()
      );
      const synced = syncInvoiceStatuses(sorted);

      await Promise.all(
        synced
          .filter((inv, i) => inv.status !== sorted[i].status && inv.id)
          .map((inv) =>
            BillingService.invoices.update(companyId!, inv.id!, {
              status: inv.status,
            })
          )
      );

      return synced;
    },
    enabled: !!companyId,
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: CreateInvoiceDTO) => {
      const isPosting = data.status === "sent" || data.status === "paid";
      let payload: CreateInvoiceDTO = {
        ...data,
        status: data.status ?? "draft",
        invoiceNumber: data.invoiceNumber || "DRAFT",
        amountPaid: data.amountPaid ?? 0,
      };

      if (isPosting) {
        const invoiceNumber = await BillingService.reserveInvoiceNumber(companyId!);
        payload = {
          ...payload,
          invoiceNumber,
          postedAt: new Date(),
        };
      }

      const res = await BillingService.invoices.create(companyId!, payload);
      const newInvoice = convertTimestampsToDates(res.data) as Invoice;

      await postInvoiceIfNeeded(companyId!, newInvoice, true);
      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
    },
  });
}

export function useInvoice(id?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "invoices", companyId, id],
    queryFn: async () => {
      const res = await BillingService.invoices.getById(companyId!, id!);
      const invoice = convertTimestampsToDates(res.data) as Invoice;
      const [synced] = syncInvoiceStatuses([invoice]);
      return synced;
    },
    enabled: !!id && !!companyId,
  });
}

export function useUpdateInvoiceMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceDTO }) => {
      const existingRes = await BillingService.invoices.getById(companyId!, id);
      const existingInvoice = convertTimestampsToDates(
        existingRes.data
      ) as Invoice;

      const isPosting =
        (data.status === "sent" || data.status === "paid") &&
        existingInvoice.status === "draft";

      let patch: UpdateInvoiceDTO = { ...data };
      if (isPosting) {
        const invoiceNumber = await BillingService.reserveInvoiceNumber(
          companyId!
        );
        patch = {
          ...patch,
          invoiceNumber,
          postedAt: new Date(),
        };
      }

      const res = await BillingService.invoices.update(companyId!, id, patch);
      const updatedInvoice = convertTimestampsToDates(res.data) as Invoice;

      await postInvoiceIfNeeded(companyId!, updatedInvoice, isPosting);
      return updatedInvoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({
        queryKey: ["billing", "invoices", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
    },
  });
}

export function useInvoicesByCustomer(customerId?: string) {
  const { data: invoices = [], ...rest } = useInvoices();
  const filtered = customerId
    ? invoices.filter((i) => i.customerId === customerId)
    : [];
  return { data: filtered, ...rest };
}
