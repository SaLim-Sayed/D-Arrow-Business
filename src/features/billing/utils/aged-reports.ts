import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";
import { getInvoiceAmountDue } from "./accounting-engine";

export type AgingBucketKey =
  | "current"
  | "1_30"
  | "31_60"
  | "61_90"
  | "90_plus";

export const AGING_BUCKET_LABELS: Record<AgingBucketKey, string> = {
  current: "Current",
  "1_30": "1–30 days",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  "90_plus": "90+ days",
};

export function getAgingBucketLabels(
  t: (key: string) => string
): Record<AgingBucketKey, string> {
  return {
    current: t("reports.aging_buckets.current"),
    "1_30": t("reports.aging_buckets.1_30"),
    "31_60": t("reports.aging_buckets.31_60"),
    "61_90": t("reports.aging_buckets.61_90"),
    "90_plus": t("reports.aging_buckets.90_plus"),
  };
}

export function getAgingBucket(
  dueDate: Date,
  asOf: Date = new Date()
): AgingBucketKey {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date(asOf);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diffDays <= 0) return "current";
  if (diffDays <= 30) return "1_30";
  if (diffDays <= 60) return "31_60";
  if (diffDays <= 90) return "61_90";
  return "90_plus";
}

export interface AgedRow {
  partyId: string;
  partyName: string;
  buckets: Record<AgingBucketKey, number>;
  total: number;
}

function emptyBuckets(): Record<AgingBucketKey, number> {
  return { current: 0, "1_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0 };
}

export function buildAgedReceivablesReport(
  invoices: Invoice[],
  getPartyName: (id: string) => string
): { rows: AgedRow[]; totals: Record<AgingBucketKey, number>; grandTotal: number } {
  const open = invoices.filter(
    (inv) =>
      (inv.status === "sent" || inv.status === "overdue") &&
      getInvoiceAmountDue(inv) > 0
  );

  const byParty = new Map<string, AgedRow>();
  const totals = emptyBuckets();

  for (const inv of open) {
    const due = getInvoiceAmountDue(inv);
    const bucket = getAgingBucket(inv.dueDate);
    const partyId = inv.customerId;
    const existing = byParty.get(partyId) ?? {
      partyId,
      partyName: getPartyName(partyId),
      buckets: emptyBuckets(),
      total: 0,
    };
    existing.buckets[bucket] += due;
    existing.total += due;
    totals[bucket] += due;
    byParty.set(partyId, existing);
  }

  const rows = Array.from(byParty.values()).sort((a, b) => b.total - a.total);
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  return { rows, totals, grandTotal };
}

export function getBillAmountDue(bill: Bill): number {
  return Math.max(0, bill.grandTotal - (bill.amountPaid ?? 0));
}

export function buildAgedPayablesReport(
  bills: Bill[],
  getPartyName: (id: string) => string
): { rows: AgedRow[]; totals: Record<AgingBucketKey, number>; grandTotal: number } {
  const open = bills.filter(
    (bill) =>
      (bill.status === "open" || bill.status === "overdue") &&
      getBillAmountDue(bill) > 0
  );

  const byParty = new Map<string, AgedRow>();
  const totals = emptyBuckets();

  for (const bill of open) {
    const due = getBillAmountDue(bill);
    const bucket = getAgingBucket(bill.dueDate);
    const partyId = bill.vendorId;
    const existing = byParty.get(partyId) ?? {
      partyId,
      partyName: getPartyName(partyId),
      buckets: emptyBuckets(),
      total: 0,
    };
    existing.buckets[bucket] += due;
    existing.total += due;
    totals[bucket] += due;
    byParty.set(partyId, existing);
  }

  const rows = Array.from(byParty.values()).sort((a, b) => b.total - a.total);
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  return { rows, totals, grandTotal };
}
