import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invoice, CreateInvoiceDTO, UpdateInvoiceDTO } from "../schemas/invoice";
import type { CreateJournalEntryDTO } from "../schemas/journal";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";

export function useInvoices() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "invoices", companyId],
    queryFn: async () => {
      const res = await BillingService.invoices.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as Invoice[];
      return data.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
    },
    enabled: !!companyId,
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: async (data: CreateInvoiceDTO) => {
      const payload = {
        ...data,
        status: data.status ?? "draft",
      };

      const res = await BillingService.invoices.create(companyId!, payload);
      const newInvoice = convertTimestampsToDates(res.data) as Invoice;

      // If the invoice is published/sent, it creates an accounting journal entry!
      if (newInvoice.status === "sent" || newInvoice.status === "paid") {
        const je: CreateJournalEntryDTO = {
          journalNumber: `JE-INV-${newInvoice.invoiceNumber}`,
          date: newInvoice.issueDate,
          reference: newInvoice.invoiceNumber,
          notes: `Auto-generated from Invoice ${newInvoice.invoiceNumber}`,
          sourceType: "invoice",
          sourceId: newInvoice.id,
          totalDebit: newInvoice.grandTotal,
          totalCredit: newInvoice.grandTotal,
          currency: newInvoice.currency,
          status: "published",
          lines: [
            {
              id: `jel_${Math.random().toString(36).slice(2)}`,
              accountId: "acc_1200", // Accounts Receivable
              debit: newInvoice.grandTotal,
              credit: 0,
              description: `Invoice ${newInvoice.invoiceNumber} receivable`,
            },
            {
              id: `jel_${Math.random().toString(36).slice(2)}`,
              accountId: "acc_4000", // Sales Revenue
              debit: 0,
              credit: newInvoice.subTotal,
              description: `Sales from ${newInvoice.invoiceNumber}`,
            }
          ]
        };

        if (newInvoice.totalTax > 0) {
          je.lines.push({
            id: `jel_${Math.random().toString(36).slice(2)}`,
            accountId: "acc_2000", // Using Accounts Payable or Tax Liability
            debit: 0,
            credit: newInvoice.totalTax,
            description: `Tax from ${newInvoice.invoiceNumber}`,
          });
        }

        try {
          await BillingService.journals.create(companyId!, je);
        } catch (error) {
          console.error("Failed to generate journal entry for invoice:", error);
        }
      }

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
    },
  });
}

export function useInvoice(id?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "invoices", companyId, id],
    queryFn: async () => {
      const res = await BillingService.invoices.getById(companyId!, id!);
      return convertTimestampsToDates(res.data) as Invoice;
    },
    enabled: !!id && !!companyId,
  });
}

export function useUpdateInvoiceMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceDTO }) => {
      // Get the existing invoice to check its status before update
      const existingRes = await BillingService.invoices.getById(companyId!, id);
      const existingInvoice = convertTimestampsToDates(existingRes.data) as Invoice;

      const res = await BillingService.invoices.update(companyId!, id, data);
      const updatedInvoice = convertTimestampsToDates(res.data) as Invoice;

      // Handle accounting entry if status changes to sent/paid
      if ((data.status === "sent" || data.status === "paid") && existingInvoice.status === "draft") {
        const je: CreateJournalEntryDTO = {
          journalNumber: `JE-INV-${updatedInvoice.invoiceNumber}`,
          date: updatedInvoice.issueDate,
          reference: updatedInvoice.invoiceNumber,
          notes: `Auto-generated from Invoice ${updatedInvoice.invoiceNumber}`,
          sourceType: "invoice",
          sourceId: updatedInvoice.id,
          totalDebit: updatedInvoice.grandTotal,
          totalCredit: updatedInvoice.grandTotal,
          currency: updatedInvoice.currency,
          status: "published",
          lines: [
            {
              id: `jel_${Math.random().toString(36).slice(2)}`,
              accountId: "acc_1200", // Accounts Receivable
              debit: updatedInvoice.grandTotal,
              credit: 0,
              description: `Invoice ${updatedInvoice.invoiceNumber} receivable`,
            },
            {
              id: `jel_${Math.random().toString(36).slice(2)}`,
              accountId: "acc_4000", // Sales Revenue
              debit: 0,
              credit: updatedInvoice.subTotal,
              description: `Sales from ${updatedInvoice.invoiceNumber}`,
            }
          ]
        };

        if (updatedInvoice.totalTax > 0) {
          je.lines.push({
            id: `jel_${Math.random().toString(36).slice(2)}`,
            accountId: "acc_2000", // Tax Liability
            debit: 0,
            credit: updatedInvoice.totalTax,
            description: `Tax from ${updatedInvoice.invoiceNumber}`,
          });
        }
        
        try {
          await BillingService.journals.create(companyId!, je);
        } catch (error) {
          console.error("Failed to generate journal entry for invoice update:", error);
        }
      }

      return updatedInvoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
    },
  });
}
