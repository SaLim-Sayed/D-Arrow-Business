import { z } from "zod";

export const journalLineSchema = z.object({
  id: z.string().optional(),
  accountId: z.string().min(1, "Account is required"),
  description: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "Either debit or credit must be greater than zero",
  path: ["debit"],
}).refine(data => !(data.debit > 0 && data.credit > 0), {
  message: "A single line cannot have both debit and credit",
  path: ["debit"],
});

export const journalEntrySchema = z.object({
  id: z.string().optional(),
  journalNumber: z.string().min(1, "Journal number is required"),
  date: z.date(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(journalLineSchema).min(2, "At least two lines are required for double-entry"),
  totalDebit: z.number().min(0),
  totalCredit: z.number().min(0),
  currency: z.string().default("USD"),
  status: z.enum(["draft", "published", "void"]).default("draft"),
  sourceType: z.enum(["manual", "invoice", "bill", "payment", "refund"]).default("manual"),
  sourceId: z.string().optional(), // ID of the invoice, bill, etc.
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine(data => Math.abs(data.totalDebit - data.totalCredit) < 0.01, {
  message: "Total Debits must equal Total Credits",
  path: ["totalDebit"],
});

export type JournalLine = z.infer<typeof journalLineSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type CreateJournalEntryDTO = Omit<JournalEntry, "id" | "createdAt" | "updatedAt">;
export type UpdateJournalEntryDTO = Partial<CreateJournalEntryDTO>;
