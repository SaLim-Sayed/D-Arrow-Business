import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bill, CreateBillDTO } from "../schemas/bill";
import type { CreateJournalEntryDTO } from "../schemas/journal";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";

export function useBills() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "bills", companyId],
    queryFn: async () => {
      const res = await BillingService.bills.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as Bill[];
      return data.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
    },
    enabled: !!companyId,
  });
}

export function useCreateBillMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: async (data: CreateBillDTO) => {
      const payload = {
        ...data,
        status: data.status ?? "open",
      };

      const res = await BillingService.bills.create(companyId!, payload);
      const newBill = convertTimestampsToDates(res.data) as Bill;

      // If the bill is opened/received, it creates an accounting journal entry!
      if (newBill.status === "open" || newBill.status === "paid") {
        const lines = newBill.items.map(item => ({
          id: `jel_${Math.random().toString(36).slice(2)}`,
          accountId: item.accountId, // e.g. Expense account
          debit: item.total,
          credit: 0,
          description: `Bill ${newBill.billNumber} - ${item.description}`,
        }));

        // Credit Accounts Payable
        // Note: For a real system, we'd query the Accounts Payable system account.
        // Assuming "acc_2000" was seeded as Accounts Payable.
        lines.push({
          id: `jel_${Math.random().toString(36).slice(2)}`,
          accountId: "acc_2000", 
          debit: 0,
          credit: newBill.grandTotal,
          description: `Bill ${newBill.billNumber} payable`,
        });

        // Add Tax as Debit if applicable
        if (newBill.totalTax > 0) {
          lines.push({
            id: `jel_${Math.random().toString(36).slice(2)}`,
            accountId: "acc_1500", // Recoverable tax asset
            debit: newBill.totalTax,
            credit: 0,
            description: `Tax from Bill ${newBill.billNumber}`,
          });
        }

        const je: CreateJournalEntryDTO = {
          journalNumber: `JE-BILL-${newBill.billNumber}`,
          date: newBill.issueDate,
          reference: newBill.billNumber,
          notes: `Auto-generated from Bill ${newBill.billNumber}`,
          sourceType: "bill",
          sourceId: newBill.id,
          totalDebit: newBill.grandTotal, 
          totalCredit: newBill.grandTotal,
          currency: newBill.currency,
          status: "published",
          lines: lines,
        };

        console.log("Accounting Engine: Generating Journal Entry for Bill", je);
        try {
          await BillingService.journals.create(companyId!, je);
        } catch (error) {
          console.error("Failed to generate journal entry for bill:", error);
          // In production, we'd rollback the bill creation or use a batch write.
        }
      }

      return newBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "bills"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
    },
  });
}
