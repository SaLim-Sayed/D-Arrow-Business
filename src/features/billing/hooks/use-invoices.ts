import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invoice, CreateInvoiceDTO } from "../schemas/invoice";
import type { CreateJournalEntryDTO } from "../schemas/journal";

let invoicesCache: Invoice[] = [
  {
    id: "inv_1",
    invoiceNumber: "INV-0001",
    customerId: "cust_123",
    status: "draft",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    items: [
      { id: "item_1", description: "Consulting Services", quantity: 10, unitPrice: 150, taxRate: 15, discount: 0, total: 1725 },
    ],
    subTotal: 1500,
    totalTax: 225,
    totalDiscount: 0,
    grandTotal: 1725,
    currency: "USD",
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useInvoices() {
  return useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: async () => {
      await delay(400);
      return [...invoicesCache].sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
    },
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInvoiceDTO) => {
      await delay(600);
      
      const newInvoice: Invoice = {
        ...data,
        id: `inv_${Math.random().toString(36).slice(2)}`,
        status: data.status ?? "draft",
      };

      invoicesCache.push(newInvoice);

      // If the invoice is published/sent, it creates an accounting journal entry!
      if (newInvoice.status === "sent" || newInvoice.status === "paid") {
        // This logic normally lives in a backend Firebase Function / Transaction.
        // Debit Accounts Receivable (1200)
        // Credit Sales Revenue (4000)
        // Credit Tax Payable (Liability - assuming acc_2500)
        
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
              accountId: "acc_1200", // Accounts Receivable
              debit: newInvoice.grandTotal,
              credit: 0,
              description: `Invoice ${newInvoice.invoiceNumber} receivable`,
            },
            {
              accountId: "acc_4000", // Sales Revenue
              debit: 0,
              credit: newInvoice.subTotal,
              description: `Sales from ${newInvoice.invoiceNumber}`,
            }
          ]
        };

        if (newInvoice.totalTax > 0) {
          je.lines.push({
            accountId: "acc_2000", // Using Accounts Payable or Tax Liability
            debit: 0,
            credit: newInvoice.totalTax,
            description: `Tax from ${newInvoice.invoiceNumber}`,
          });
        }

        // We could call `useCreateJournalMutation` directly or just simulate it here.
        // For the sake of the mock, we will just console log the generated journal.
        console.log("Accounting Engine: Generated Journal Entry for Invoice", je);
      }

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
    },
  });
}
