import type { LeadPriority, LeadSource, LeadStatus } from "../types/leads.types";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

export const LEAD_SOURCES: LeadSource[] = [
  "website",
  "referral",
  "social",
  "cold_call",
  "event",
  "other",
];

export const LEAD_PRIORITIES: LeadPriority[] = ["low", "medium", "high"];

/** Display label for a lead source, preferring the free-text value on "other". */
export function leadSourceLabel(
  lead: { source?: string; sourceOther?: string },
  t: (key: string, fallback: string) => string
): string {
  const custom = lead.sourceOther?.trim();
  if (lead.source === "other" && custom) return custom;
  if (!lead.source) return "";
  return t(`leads.source.${lead.source}`, lead.source);
}

/** Legacy Firestore values */
export function normalizeLeadStatus(status: string): LeadStatus {
  if (status === "proposal") return "proposal_sent";
  return status as LeadStatus;
}

export const LEAD_STATUS_COLORS: Record<
  LeadStatus,
  "default" | "primary" | "secondary" | "success" | "warning" | "danger"
> = {
  new: "primary",
  contacted: "warning",
  qualified: "success",
  proposal_sent: "secondary",
  negotiation: "primary",
  won: "success",
  lost: "danger",
};

export type LeadSortField = "name" | "company" | "status" | "createdAt";
export type LeadSortOrder = "asc" | "desc";
