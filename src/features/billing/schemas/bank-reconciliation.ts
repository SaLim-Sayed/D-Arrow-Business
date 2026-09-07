export interface BankStatementItem {
  id: string;
  date: string;
  description: string;
  reference?: string;
  amount: number; // positive = deposit / credit, negative = withdrawal / debit
  type: "credit" | "debit";
  status: "reconciled" | "unreconciled" | "pending";
  matchedTransactionId?: string;
  matchedTransactionType?: "invoice" | "bill" | "voucher" | "journal";
}

export interface BankReconciliationSummary {
  statementDate: string;
  bankAccountName: string;
  accountNumber: string;
  statementOpeningBalance: number;
  statementClosingBalance: number;
  bookBalance: number;
  reconciledCount: number;
  unreconciledCount: number;
  differenceAmount: number;
}
