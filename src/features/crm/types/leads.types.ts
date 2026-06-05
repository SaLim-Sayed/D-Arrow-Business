import type { CrmBaseFields } from "./crm.common.types";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export type LeadPriority = "low" | "medium" | "high";

export type LeadSource =
  | "website"
  | "referral"
  | "social"
  | "cold_call"
  | "event"
  | "other";

export interface Lead extends CrmBaseFields {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source?: LeadSource | string;
  priority?: LeadPriority;
  assignedTo: string | null;
  contactId?: string | null;
  dealId?: string | null;
  notes: string;
}

export type CreateLeadDTO = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadDTO = Partial<CreateLeadDTO>;

export interface LeadFilters {
  status?: LeadStatus[];
  source?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
