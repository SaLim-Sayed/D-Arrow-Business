import { z } from "zod";

export const ZAKAT_RATE = 0.025;

export const zakatRecordSchema = z.object({
  id: z.string().optional(),
  fiscalYear: z.string().min(1, "Fiscal year is required"),
  periodEnd: z.date(),
  eligibleAssets: z.number(),
  currentLiabilities: z.number(),
  zakatBase: z.number(),
  rate: z.number().min(0).default(ZAKAT_RATE),
  zakatDue: z.number().min(0),
  currency: z.string().default("USD"),
  status: z.enum(["draft", "accrued", "paid"]).default("draft"),
  accrualJournalId: z.string().optional(),
  paymentJournalId: z.string().optional(),
  accruedAt: z.date().optional(),
  paidAt: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ZakatRecord = z.infer<typeof zakatRecordSchema>;
export type CreateZakatRecordDTO = Omit<ZakatRecord, "id" | "createdAt" | "updatedAt">;
export type UpdateZakatRecordDTO = Partial<CreateZakatRecordDTO>;
