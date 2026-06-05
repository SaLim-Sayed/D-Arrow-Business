import type { DealStage } from "../types/deals.types";

export const DEAL_STAGES: DealStage[] = [
  "lead",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

export function normalizeDealStage(stage: string): DealStage {
  const map: Record<string, DealStage> = {
    prospecting: "lead",
    qualification: "qualified",
    proposal: "proposal_sent",
  };
  return (map[stage] ?? stage) as DealStage;
}

export const DEAL_STAGE_COLORS: Record<
  DealStage,
  "default" | "primary" | "secondary" | "success" | "warning" | "danger"
> = {
  lead: "default",
  contacted: "warning",
  qualified: "primary",
  proposal_sent: "secondary",
  negotiation: "primary",
  won: "success",
  lost: "danger",
};

export const DEAL_STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 10,
  contacted: 20,
  qualified: 40,
  proposal_sent: 60,
  negotiation: 80,
  won: 100,
  lost: 0,
};
