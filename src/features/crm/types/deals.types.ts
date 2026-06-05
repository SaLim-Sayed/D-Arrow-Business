import type { CrmBaseFields } from "./crm.common.types";

export type DealStage =
  | "lead"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export interface Deal extends CrmBaseFields {
  title: string;
  amount: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  assignedTo?: string | null;
}

export type CreateDealDTO = Omit<Deal, "id" | "createdAt" | "updatedAt">;
export type UpdateDealDTO = Partial<CreateDealDTO>;

export interface DealFilters {
  stage?: DealStage[];
  assignedTo?: string;
  search?: string;
}
