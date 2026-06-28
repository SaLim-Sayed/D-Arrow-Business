import type { Account } from "../schemas/account";

/** Normal balance for P&L: income credit-normal, expense debit-normal. */
export function plSignedAmount(account: Account): number {
  return account.currentBalance ?? 0;
}

export function isNonZeroPlAmount(amount: number): boolean {
  return Math.abs(amount) >= 0.01;
}

/** Expense line: positive = cost, negative = credit/reversal (shown in parentheses). */
export function plExpenseDisplay(amount: number): {
  value: number;
  isCredit: boolean;
} {
  if (amount >= 0) return { value: amount, isCredit: false };
  return { value: -amount, isCredit: true };
}

export function sumPlIncome(accounts: Account[]): number {
  return accounts
    .filter((a) => a.type === "income")
    .reduce((s, a) => s + plSignedAmount(a), 0);
}

export function sumPlExpenses(accounts: Account[]): number {
  return accounts
    .filter((a) => a.type === "expense")
    .reduce((s, a) => s + plSignedAmount(a), 0);
}
