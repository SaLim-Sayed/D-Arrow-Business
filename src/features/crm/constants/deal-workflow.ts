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

export const DEAL_PROBABILITY_MAX = 10;

export const DEAL_STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 1,
  contacted: 2,
  qualified: 4,
  proposal_sent: 6,
  negotiation: 8,
  won: 10,
  lost: 0,
};

/** Normalize legacy 0–100 values to the 0–10 scale. */
export function normalizeDealProbability(value: number): number {
  const scaled = value > DEAL_PROBABILITY_MAX ? Math.round(value / 10) : value;
  return Math.min(DEAL_PROBABILITY_MAX, Math.max(0, scaled));
}
