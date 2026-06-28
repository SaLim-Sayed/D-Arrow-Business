import { z } from "zod";

export const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
] as const;

export const ACCOUNT_SUB_TYPES = [
  // Assets
  "current_asset",
  "fixed_asset",
  "inventory",
  "bank",
  "cash",
  "accounts_receivable",
  // Liabilities
  "current_liability",
  "long_term_liability",
  "accounts_payable",
  "credit_card",
  // Equity
  "equity",
  "retained_earnings",
  // Income
  "operating_income",
  "other_income",
  // Expenses
  "operating_expense",
  "cost_of_goods_sold",
  "other_expense",
] as const;

export const accountSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Account code is required"), // e.g., 1000, 1010
  name: z.string().min(1, "Account name is required"),
  type: z.enum(ACCOUNT_TYPES),
  subType: z.enum(ACCOUNT_SUB_TYPES),
  parentId: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isSystemAccount: z.boolean().default(false), // System accounts cannot be deleted (e.g., Accounts Receivable)
  currency: z.string().default("USD"),
  currentBalance: z.number().default(0), // Cached balance, actual balance is sum of journal entries
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AccountType = typeof ACCOUNT_TYPES[number];
export type AccountSubType = typeof ACCOUNT_SUB_TYPES[number];
export type Account = z.infer<typeof accountSchema>;
export type CreateAccountDTO = Omit<Account, "id" | "createdAt" | "updatedAt">;
export type UpdateAccountDTO = Partial<CreateAccountDTO>;
