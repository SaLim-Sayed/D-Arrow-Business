export interface FiscalYear {
  year: number;
  startDate: string;
  endDate: string;
  status: "open" | "closed" | "locked";
  totalRevenue: number;
  totalExpense: number;
  netProfitLoss: number;
  closingJournalId?: string;
  closedAt?: string;
}

export interface LockDateSettings {
  lockDate?: string;
  lockReason?: string;
  isLocked: boolean;
}
