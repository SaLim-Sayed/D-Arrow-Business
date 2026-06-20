import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry, CreateJournalEntryDTO } from "../schemas/journal";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";

export function useJournals() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "journals", companyId],
    queryFn: async () => {
      const res = await BillingService.journals.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as JournalEntry[];
      
      // We sort manually since we just used a simple getAll and maybe want client-side sorting by actual date
      return data.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!companyId,
  });
}

export function useCreateJournalMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: async (data: CreateJournalEntryDTO) => {
      // Validate Double Entry mathematically just to be safe
      const totalDebits = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredits = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error("Journal entry must balance (Debits = Credits)");
      }

      const payload = {
        ...data,
        status: data.status ?? "published",
        totalDebit: totalDebits,
        totalCredit: totalCredits,
        lines: data.lines.map(l => ({ ...l, id: l.id || `jel_${Math.random().toString(36).slice(2)}` }))
      };

      const res = await BillingService.journals.create(companyId!, payload);

      // In a real system, here we would trigger a Firestore Transaction 
      // that creates the Journal Entry AND updates the `currentBalance` of every Account involved.

      return convertTimestampsToDates(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      // We also invalidate accounts because their balances theoretically changed
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useUpdateJournalMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateJournalEntryDTO> }) => {
      if (data.lines) {
        const totalDebits = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
          throw new Error("Journal entry must balance (Debits = Credits)");
        }
        data.totalDebit = totalDebits;
        data.totalCredit = totalCredits;
        // ensure existing lines have IDs and new ones get them
        data.lines = data.lines.map(l => ({ ...l, id: l.id || `jel_${Math.random().toString(36).slice(2)}` }));
      }

      const res = await BillingService.journals.update(companyId!, id, data);
      return convertTimestampsToDates(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
