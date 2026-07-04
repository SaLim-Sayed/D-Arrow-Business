export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  description?: string;
  // This is a cached balance, recalculated via cloud functions or read-time aggregation
  currentBalance: number; 
}

export interface Journal {
  id: string;
  code: string; // e.g. SAL, BNK, MISC
  name: string;
  isActive: boolean;
  createdAt: number;
}

export type JournalEntryStatus = 'draft' | 'posted' | 'cancelled';

export interface JournalEntry {
  id: string;
  journalId: string;
  date: number; // Unix timestamp
  reference: string;
  memo: string;
  status: JournalEntryStatus;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  totalDebit: number; // Redundant, for quick display
  totalCredit: number; // Redundant, for quick display
}

export interface JournalItem {
  id: string;
  entryId: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  partnerId?: string; // e.g., Customer or Vendor ID
}
