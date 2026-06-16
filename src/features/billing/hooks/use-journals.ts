import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry, CreateJournalEntryDTO } from "../schemas/journal";

// Mock Data for Journals
let journalsCache: JournalEntry[] = [
  {
    id: "je_1",
    journalNumber: "JE-0001",
    date: new Date(),
    reference: "Initial Capital",
    notes: "Owner's initial investment",
    lines: [
      { id: "jel_1", accountId: "acc_1000", debit: 10000, credit: 0, description: "Capital deposit" },
      { id: "jel_2", accountId: "acc_3000", debit: 0, credit: 10000, description: "Owner's Equity" },
    ],
    totalDebit: 10000,
    totalCredit: 10000,
    currency: "USD",
    status: "published",
    sourceType: "manual",
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useJournals() {
  return useQuery({
    queryKey: ["billing", "journals"],
    queryFn: async () => {
      await delay(400);
      return [...journalsCache].sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });
}

export function useCreateJournalMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateJournalEntryDTO) => {
      await delay(600);
      // Validate Double Entry mathematically just to be safe
      const totalDebits = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredits = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error("Journal entry must balance (Debits = Credits)");
      }

      const newEntry: JournalEntry = {
        ...data,
        id: `je_${Math.random().toString(36).slice(2)}`,
        status: data.status ?? "published",
        totalDebit: totalDebits,
        totalCredit: totalCredits,
        lines: data.lines.map(l => ({ ...l, id: `jel_${Math.random().toString(36).slice(2)}` }))
      };

      journalsCache.push(newEntry);

      // In a real system, here we would trigger a Firestore Transaction 
      // that creates the Journal Entry AND updates the `currentBalance` of every Account involved.
      // But for mock data, we just store the journal.

      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      // We also invalidate accounts because their balances theoretically changed
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
