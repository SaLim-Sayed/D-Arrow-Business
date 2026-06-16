import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bill, CreateBillDTO } from "../schemas/bill";
import type { CreateJournalEntryDTO } from "../schemas/journal";

let billsCache: Bill[] = [
  {
    id: "bill_1",
    billNumber: "BILL-0001",
    vendorId: "vend_123",
    status: "open",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [
      { id: "bitem_1", description: "Office Supplies", accountId: "acc_6000", quantity: 1, unitPrice: 300, taxRate: 0, total: 300 },
    ],
    subTotal: 300,
    totalTax: 0,
    grandTotal: 300,
    currency: "USD",
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useBills() {
  return useQuery({
    queryKey: ["billing", "bills"],
    queryFn: async () => {
      await delay(400);
      return [...billsCache].sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
    },
  });
}

export function useCreateBillMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBillDTO) => {
      await delay(600);
      
      const newBill: Bill = {
        ...data,
        id: `bill_${Math.random().toString(36).slice(2)}`,
        status: data.status ?? "open",
      };

      billsCache.push(newBill);

      // If the bill is opened/received, it creates an accounting journal entry!
      if (newBill.status === "open" || newBill.status === "paid") {
        // Debit Expense/Asset Accounts from items
        // Credit Accounts Payable (2000)
        
        const lines = newBill.items.map(item => ({
          accountId: item.accountId, // e.g. Expense account
          debit: item.total,
          credit: 0,
          description: `Bill ${newBill.billNumber} - ${item.description}`,
        }));

        // Credit Accounts Payable
        lines.push({
          accountId: "acc_2000", // Accounts Payable
          debit: 0,
          credit: newBill.grandTotal,
          description: `Bill ${newBill.billNumber} payable`,
        });

        // Add Tax as Debit if applicable (assuming tax is recoverable)
        if (newBill.totalTax > 0) {
          lines.push({
            accountId: "acc_1500", // Using an asset account for recoverable tax
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
          totalDebit: newBill.grandTotal, // Technically subTotal + Tax
          totalCredit: newBill.grandTotal,
          currency: newBill.currency,
          status: "published",
          lines: lines,
        };

        console.log("Accounting Engine: Generated Journal Entry for Bill", je);
      }

      return newBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "bills"] });
    },
  });
}
