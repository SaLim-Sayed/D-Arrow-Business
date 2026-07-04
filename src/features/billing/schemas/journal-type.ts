import { z } from "zod";

/**
 * Journal Types - Odoo-style classification
 * Different journals for different transaction types
 */
export const JOURNAL_TYPES = [
  "sale",
  "purchase",
  "bank",
  "cash",
  "general",
  "situation",
] as const;

export const journalTypeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Journal code is required"), // e.g., SALE, PUR, BNK, CSH
  name: z.string().min(1, "Journal name is required"),
  type: z.enum(JOURNAL_TYPES),
  description: z.string().optional(),
  defaultAccountId: z.string().optional(), // Default account for this journal (e.g., bank account for bank journal)
  currency: z.string().default("USD"),
  isActive: z.boolean().default(true),
  isSystemJournal: z.boolean().default(false), // System journals cannot be deleted
  sequence: z.number().int().min(0).default(0), // Sequence for numbering entries
  allowDateVariance: z.number().int().min(0).default(0), // Days variance allowed for entry dates
  restrictToAccounts: z.array(z.string()).optional(), // Restrict entries to specific accounts
  restrictToPartners: z.array(z.string()).optional(), // Restrict entries to specific partners
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type JournalType = typeof JOURNAL_TYPES[number];
export type JournalTypeConfig = z.infer<typeof journalTypeSchema>;
export type CreateJournalTypeDTO = Omit<JournalTypeConfig, "id" | "createdAt" | "updatedAt">;
export type UpdateJournalTypeDTO = Partial<CreateJournalTypeDTO>;

/**
 * Default Journal Types template
 * Based on Odoo's standard journal configuration
 */
export const DEFAULT_JOURNAL_TYPES: Omit<CreateJournalTypeDTO, "isActive">[] = [
  {
    code: "SALE",
    name: "Sales Journal",
    type: "sale",
    description: "Journal for customer invoices and sales transactions",
    currency: "USD",
    isSystemJournal: true,
    sequence: 1,
    allowDateVariance: 30,
  },
  {
    code: "PUR",
    name: "Purchase Journal",
    type: "purchase",
    description: "Journal for vendor bills and purchase transactions",
    currency: "USD",
    isSystemJournal: true,
    sequence: 2,
    allowDateVariance: 30,
  },
  {
    code: "BNK",
    name: "Bank Journal",
    type: "bank",
    description: "Journal for bank transactions and payments",
    currency: "USD",
    isSystemJournal: true,
    sequence: 3,
    allowDateVariance: 7,
  },
  {
    code: "CSH",
    name: "Cash Journal",
    type: "cash",
    description: "Journal for cash transactions",
    currency: "USD",
    isSystemJournal: true,
    sequence: 4,
    allowDateVariance: 3,
  },
  {
    code: "MISC",
    name: "Miscellaneous Journal",
    type: "general",
    description: "Journal for miscellaneous and adjustment entries",
    currency: "USD",
    isSystemJournal: true,
    sequence: 5,
    allowDateVariance: 365,
  },
  {
    code: "SIT",
    name: "Situation Journal",
    type: "situation",
    description: "Journal for opening and closing entries",
    currency: "USD",
    isSystemJournal: true,
    sequence: 6,
    allowDateVariance: 0,
  },
];

/**
 * Helper function to get journal type by code
 */
export function getJournalTypeByCode(
  journalTypes: JournalTypeConfig[],
  code: string
): JournalTypeConfig | undefined {
  return journalTypes.find((jt) => jt.code === code && jt.isActive);
}

/**
 * Helper function to get journal type by type
 */
export function getJournalTypeByType(
  journalTypes: JournalTypeConfig[],
  type: JournalType
): JournalTypeConfig | undefined {
  return journalTypes.find((jt) => jt.type === type && jt.isActive);
}

/**
 * Helper function to validate if an account is allowed for a journal
 */
export function isAccountAllowedForJournal(
  journal: JournalTypeConfig,
  accountId: string
): boolean {
  if (!journal.restrictToAccounts || journal.restrictToAccounts.length === 0) {
    return true;
  }
  return journal.restrictToAccounts.includes(accountId);
}
