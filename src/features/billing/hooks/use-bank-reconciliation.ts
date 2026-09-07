import { useState, useMemo } from "react";
import type { BankStatementItem, BankReconciliationSummary } from "../schemas/bank-reconciliation";

const MOCK_BANK_ITEMS: BankStatementItem[] = [
  {
    id: "BS-001",
    date: "2026-09-01",
    description: "إيداع عميل - شركة الأفق للتكنولوجيا",
    reference: "REF-9921",
    amount: 17250,
    type: "credit",
    status: "reconciled",
    matchedTransactionId: "INV-1001",
    matchedTransactionType: "invoice",
  },
  {
    id: "BS-002",
    date: "2026-09-02",
    description: "سداد فاتورة توريد أجهزة - مؤسسة البناء",
    reference: "REF-4412",
    amount: -8625,
    type: "debit",
    status: "reconciled",
    matchedTransactionId: "BILL-2001",
    matchedTransactionType: "bill",
  },
  {
    id: "BS-003",
    date: "2026-09-04",
    description: "تحويل وارد - مؤسسة النجاح للحلول",
    reference: "TRF-8812",
    amount: 25000,
    type: "credit",
    status: "unreconciled",
  },
  {
    id: "BS-004",
    date: "2026-09-05",
    description: "خصم رسوم خدمات بنكية شهرية",
    reference: "FEE-0019",
    amount: -287.5,
    type: "debit",
    status: "unreconciled",
  },
  {
    id: "BS-005",
    date: "2026-09-06",
    description: "سداد مصروفات ضيافة ومكاتب",
    reference: "PAY-1102",
    amount: -1500,
    type: "debit",
    status: "unreconciled",
  },
];

export function useBankReconciliation() {
  const [items, setItems] = useState<BankStatementItem[]>(MOCK_BANK_ITEMS);
  const [bankAccountName] = useState("البنك الأهلي السعودي - حساب رئيسي");
  const [accountNumber] = useState("SA4410000001234567890101");

  const summary = useMemo<BankReconciliationSummary>(() => {
    const reconciled = items.filter((i) => i.status === "reconciled");
    const unreconciled = items.filter((i) => i.status === "unreconciled");
    
    const statementOpeningBalance = 150000;
    const netChange = items.reduce((acc, curr) => acc + curr.amount, 0);
    const statementClosingBalance = statementOpeningBalance + netChange;
    const bookBalance = statementClosingBalance - unreconciled.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      statementDate: new Date().toISOString().slice(0, 10),
      bankAccountName,
      accountNumber,
      statementOpeningBalance,
      statementClosingBalance,
      bookBalance,
      reconciledCount: reconciled.length,
      unreconciledCount: unreconciled.length,
      differenceAmount: statementClosingBalance - bookBalance,
    };
  }, [items, bankAccountName, accountNumber]);

  const matchItem = (id: string, matchId: string, matchType: "invoice" | "bill" | "voucher" | "journal") => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "reconciled",
              matchedTransactionId: matchId,
              matchedTransactionType: matchType,
            }
          : item
      )
    );
  };

  const unmatchItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "unreconciled",
              matchedTransactionId: undefined,
              matchedTransactionType: undefined,
            }
          : item
      )
    );
  };

  const importStatement = (newItems: Omit<BankStatementItem, "id" | "status">[]) => {
    const formatted: BankStatementItem[] = newItems.map((item, index) => ({
      ...item,
      id: `BS-${Date.now()}-${index}`,
      status: "unreconciled",
    }));
    setItems((prev) => [...formatted, ...prev]);
  };

  return {
    items,
    summary,
    matchItem,
    unmatchItem,
    importStatement,
  };
}
