import { accountingService } from "./accountingService";
import type { Invoice } from "../../billing/schemas/invoice";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// In a real application, these would be fetched from a Settings collection
// For now, we use constants to map to the Chart of Accounts
export const DEFAULT_ACCOUNTS = {
  ACCOUNTS_RECEIVABLE: "acc_receivable_default",
  SALES_REVENUE: "acc_revenue_default",
  VAT_PAYABLE: "acc_vat_default",
};

export const DEFAULT_JOURNALS = {
  SALES_JOURNAL: "journal_sales_default",
};

export const automationService = {
  /**
   * Automatically posts a validated Invoice to the Accounting Module.
   * Generates a Double-Entry transaction based on Daftra rules:
   * Debit: Accounts Receivable (Grand Total)
   * Credit: Sales Revenue (Sub Total)
   * Credit: VAT Payable (Total Tax)
   */
  async postInvoiceToAccounting(invoice: Invoice): Promise<string> {
    if (!invoice.id) {
      throw new Error("Cannot post an invoice that has not been saved to the database.");
    }

    if (invoice.status === "draft") {
      throw new Error("Cannot post a draft invoice to accounting.");
    }

    const { invoiceNumber, grandTotal, subTotal, totalTax, customerId } = invoice;

    // Build Journal Entry Metadata
    const entryData = {
      journalId: DEFAULT_JOURNALS.SALES_JOURNAL,
      date: Date.now(),
      reference: `INV-${invoiceNumber}`,
      memo: `Automated entry for Invoice ${invoiceNumber}`,
      status: "posted" as const,
      createdBy: "system_automation",
    };

    // Build the Double Entry Items
    const itemsData = [];

    // 1. Debit Accounts Receivable (Full Amount)
    itemsData.push({
      accountId: DEFAULT_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      description: `Invoice ${invoiceNumber}`,
      debit: grandTotal,
      credit: 0,
      partnerId: customerId,
    });

    // 2. Credit Sales Revenue (Sub Total)
    itemsData.push({
      accountId: DEFAULT_ACCOUNTS.SALES_REVENUE,
      description: `Revenue from Invoice ${invoiceNumber}`,
      debit: 0,
      credit: subTotal,
      partnerId: customerId,
    });

    // 3. Credit VAT Payable (Tax Amount) - Only if there is tax
    if (totalTax > 0) {
      itemsData.push({
        accountId: DEFAULT_ACCOUNTS.VAT_PAYABLE,
        description: `VAT for Invoice ${invoiceNumber}`,
        debit: 0,
        credit: totalTax,
        partnerId: customerId,
      });
    }

    // Attempt to post the transaction using strict double-entry rules
    const journalEntryId = await accountingService.postJournalEntry(entryData, itemsData);

    // Update the invoice in the database to reflect it was posted
    const invoiceRef = doc(db, "invoices", invoice.id);
    await updateDoc(invoiceRef, {
      status: invoice.status === "sent" ? "sent" : "sent", // Or leave as is if already sent
      postedAt: serverTimestamp(),
      // Adding a dynamic field for reference. In strict typescript we might need to cast or add to schema.
      journalEntryId: journalEntryId, 
    });

    return journalEntryId;
  },
};
