import type { Account, AccountSubType } from "../schemas/account";
import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";
import type { CreateJournalEntryDTO, JournalLine } from "../schemas/journal";
import type { InvoiceSequence } from "../schemas/settings";
import type { Payment } from "../schemas/payment";

function lineId() {
  return `jel_${Math.random().toString(36).slice(2, 11)}`;
}

export function findAccountBySubType(
  accounts: Account[],
  subType: AccountSubType
): Account | undefined {
  return accounts.find((a) => a.subType === subType && a.isActive);
}

export function findAccountByCode(
  accounts: Account[],
  code: string
): Account | undefined {
  return accounts.find((a) => a.code === code && a.isActive);
}

export function requireAccount(
  accounts: Account[],
  subType: AccountSubType,
  fallbackCode?: string
): Account {
  const account =
    findAccountBySubType(accounts, subType) ??
    (fallbackCode ? findAccountByCode(accounts, fallbackCode) : undefined);
  if (!account?.id) {
    throw new Error(`Missing system account for ${subType}`);
  }
  return account;
}

export function formatSequenceNumber(seq: InvoiceSequence): string {
  const padded = String(seq.nextNumber).padStart(seq.padding, "0");
  return `${seq.prefix}${padded}${seq.suffix ?? ""}`;
}

export function getInvoiceAmountDue(invoice: Invoice): number {
  return Math.max(0, invoice.grandTotal - (invoice.amountPaid ?? 0));
}

export function syncInvoiceStatuses<T extends Invoice>(invoices: T[]): T[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return invoices.map((inv) => {
    if (inv.status !== "sent" && inv.status !== "overdue") return inv;
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    if (getInvoiceAmountDue(inv) <= 0) {
      return { ...inv, status: "paid" as const };
    }
    if (due < today) {
      return { ...inv, status: "overdue" as const };
    }
    return inv.status === "overdue" ? { ...inv, status: "sent" as const } : inv;
  });
}

export function balanceDelta(
  account: Account,
  debit: number,
  credit: number
): number {
  switch (account.type) {
    case "asset":
    case "expense":
      return debit - credit;
    case "liability":
    case "equity":
    case "income":
      return credit - debit;
    default:
      return 0;
  }
}

export function aggregateBalanceDeltas(
  accounts: Account[],
  lines: JournalLine[]
): Map<string, number> {
  const map = new Map<string, number>();
  const byId = new Map(accounts.map((a) => [a.id!, a]));

  for (const line of lines) {
    const account = byId.get(line.accountId);
    if (!account) continue;
    const delta = balanceDelta(account, line.debit, line.credit);
    map.set(line.accountId, (map.get(line.accountId) ?? 0) + delta);
  }
  return map;
}

export function buildInvoiceJournalEntry(
  invoice: Invoice,
  accounts: Account[]
): CreateJournalEntryDTO {
  const ar = requireAccount(accounts, "accounts_receivable", "1200");
  const revenue = requireAccount(accounts, "operating_income", "4000");
  const tax =
    findAccountBySubType(accounts, "current_liability") ??
    findAccountByCode(accounts, "2100") ??
    requireAccount(accounts, "accounts_payable", "2000");

  const lines: JournalLine[] = [
    {
      id: lineId(),
      accountId: ar.id!,
      debit: invoice.grandTotal,
      credit: 0,
      description: `Receivable ${invoice.invoiceNumber}`,
    },
    {
      id: lineId(),
      accountId: revenue.id!,
      debit: 0,
      credit: invoice.subTotal - invoice.totalDiscount,
      description: `Revenue ${invoice.invoiceNumber}`,
    },
  ];

  if (invoice.totalTax > 0) {
    lines.push({
      id: lineId(),
      accountId: tax.id!,
      debit: 0,
      credit: invoice.totalTax,
      description: `Tax ${invoice.invoiceNumber}`,
    });
  }

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  return {
    journalNumber: `JE-INV-${invoice.invoiceNumber}`,
    date: invoice.issueDate,
    reference: invoice.invoiceNumber,
    notes: `Posted from invoice ${invoice.invoiceNumber}`,
    sourceType: "invoice",
    sourceId: invoice.id,
    totalDebit,
    totalCredit,
    currency: invoice.currency,
    status: "published",
    lines,
  };
}

export function buildBillJournalEntry(
  bill: Bill,
  accounts: Account[]
): CreateJournalEntryDTO {
  const ap = requireAccount(accounts, "accounts_payable", "2000");
  const lines: JournalLine[] = bill.items.map((item) => ({
    id: lineId(),
    accountId: item.accountId,
    debit: item.total,
    credit: 0,
    description: `${bill.billNumber} — ${item.description}`,
  }));

  if (bill.totalTax > 0) {
    const taxAsset =
      findAccountByCode(accounts, "1500") ??
      findAccountBySubType(accounts, "current_asset");
    if (taxAsset?.id) {
      lines.push({
        id: lineId(),
        accountId: taxAsset.id,
        debit: bill.totalTax,
        credit: 0,
        description: `Tax ${bill.billNumber}`,
      });
    }
  }

  const expenseDebit = lines.reduce((s, l) => s + l.debit, 0);
  lines.push({
    id: lineId(),
    accountId: ap.id!,
    debit: 0,
    credit: expenseDebit,
    description: `Payable ${bill.billNumber}`,
  });

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

  return {
    journalNumber: `JE-BILL-${bill.billNumber}`,
    date: bill.issueDate,
    reference: bill.billNumber,
    notes: `Posted from bill ${bill.billNumber}`,
    sourceType: "bill",
    sourceId: bill.id,
    totalDebit,
    totalCredit,
    currency: bill.currency,
    status: "published",
    lines,
  };
}

export function buildPaymentJournalEntry(
  payment: Payment,
  invoice: Invoice,
  accounts: Account[]
): CreateJournalEntryDTO {
  const ar = requireAccount(accounts, "accounts_receivable", "1200");
  const bank =
    findAccountBySubType(accounts, "bank") ??
    findAccountBySubType(accounts, "cash") ??
    requireAccount(accounts, "cash", "1000");

  const lines: JournalLine[] = [
    {
      id: lineId(),
      accountId: bank.id!,
      debit: payment.amount,
      credit: 0,
      description: `Payment ${payment.reference ?? invoice.invoiceNumber}`,
    },
    {
      id: lineId(),
      accountId: ar.id!,
      debit: 0,
      credit: payment.amount,
      description: `Payment ${invoice.invoiceNumber}`,
    },
  ];

  return {
    journalNumber: `JE-PAY-${invoice.invoiceNumber}-${Date.now()}`,
    date: payment.date,
    reference: payment.reference ?? invoice.invoiceNumber,
    notes: `Customer payment for ${invoice.invoiceNumber}`,
    sourceType: "payment",
    sourceId: payment.id,
    totalDebit: payment.amount,
    totalCredit: payment.amount,
    currency: payment.currency,
    status: "published",
    lines,
  };
}

export function quotationDataToInvoiceForm(input: {
  customerId: string;
  quotationId?: string;
  currency: string;
  vatRate: number;
  pricesIncludeVat: boolean;
  notes?: string;
  validityMonths?: number;
  items: Array<{
    nameAr?: string;
    nameEn?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
}): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  const items = input.items.map((item) => {
    const description =
      item.description?.trim() ||
      item.nameEn?.trim() ||
      item.nameAr?.trim() ||
      "Item";
    let unitPrice = item.unitPrice;
    const taxRate = input.vatRate;
    if (input.pricesIncludeVat && taxRate > 0) {
      unitPrice = item.unitPrice / (1 + taxRate / 100);
    }
    const beforeTax = item.quantity * unitPrice;
    const tax = beforeTax * (taxRate / 100);
    return {
      description,
      quantity: item.quantity,
      unitPrice,
      taxRate,
      discount: 0,
      total: beforeTax + tax,
    };
  });

  const subTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTax = items.reduce((s, i) => {
    const beforeTax = i.quantity * i.unitPrice;
    return s + beforeTax * (i.taxRate / 100);
  }, 0);

  const issueDate = new Date();
  const paymentTermDays = (input.validityMonths ?? 1) * 30;
  const dueDate = new Date(
    issueDate.getTime() + paymentTermDays * 24 * 60 * 60 * 1000
  );

  return {
    invoiceNumber: "DRAFT",
    status: "draft",
    customerId: input.customerId,
    issueDate,
    dueDate,
    items,
    subTotal,
    totalTax,
    totalDiscount: 0,
    grandTotal: subTotal + totalTax,
    amountPaid: 0,
    notes: input.notes,
    currency: input.currency,
    quotationId: input.quotationId,
    paymentTermDays,
  };
}

export function quotationToInvoiceDraft(input: {
  customerId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  currency: string;
  notes?: string;
  quotationId?: string;
  paymentTermDays?: number;
}): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  const items = input.items.map((item) => {
    const beforeTax = item.quantity * item.unitPrice;
    const tax = beforeTax * (item.taxRate / 100);
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discount: 0,
      total: beforeTax + tax,
    };
  });

  const subTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTax = items.reduce((s, i) => {
    const beforeTax = i.quantity * i.unitPrice;
    return s + beforeTax * (i.taxRate / 100);
  }, 0);

  const issueDate = new Date();
  const dueDate = new Date(
    issueDate.getTime() + (input.paymentTermDays ?? 30) * 24 * 60 * 60 * 1000
  );

  return {
    invoiceNumber: "DRAFT",
    status: "draft",
    customerId: input.customerId,
    issueDate,
    dueDate,
    items,
    subTotal,
    totalTax,
    totalDiscount: 0,
    grandTotal: subTotal + totalTax,
    amountPaid: 0,
    notes: input.notes,
    currency: input.currency,
    quotationId: input.quotationId,
    paymentTermDays: input.paymentTermDays ?? 30,
  };
}
