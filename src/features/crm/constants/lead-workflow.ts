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
