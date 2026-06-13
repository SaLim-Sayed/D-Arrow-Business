import { useMemo } from "react";
import { useLeadsQuery } from "./use-leads";
import { useContactsQuery } from "./use-contacts";
import { useDealsQuery } from "./use-deals";
import { useCrmTasksQuery } from "./use-crm-tasks";
import { normalizeLeadStatus } from "../constants/lead-workflow";
import { normalizeDealStage, normalizeDealProbability } from "../constants/deal-workflow";
import type { LeadSource } from "../types/leads.types";

export function useCrmAnalytics() {
  const { data: leadsRes } = useLeadsQuery();
  const { data: contactsRes } = useContactsQuery();
  const { data: dealsRes } = useDealsQuery();
  const { data: tasksRes } = useCrmTasksQuery();

  return useMemo(() => {
    const leads = leadsRes?.data ?? [];
    const contacts = contactsRes?.data ?? [];
    const deals = dealsRes?.data ?? [];
    const tasks = tasksRes?.data ?? [];

    const activeDeals = deals.filter((d) => !["won", "lost"].includes(normalizeDealStage(d.stage)));
    const wonDeals = deals.filter((d) => normalizeDealStage(d.stage) === "won");
    const lostDeals = deals.filter((d) => normalizeDealStage(d.stage) === "lost");
    const expectedRevenue = activeDeals.reduce(
      (s, d) => s + d.amount * (normalizeDealProbability(d.probability) / 10),
      0
    );
    const wonRevenue = wonDeals.reduce((s, d) => s + d.amount, 0);

    const funnel = {
      leads: leads.length,
      qualified: leads.filter((l) =>
        ["qualified", "proposal_sent", "negotiation", "won"].includes(normalizeLeadStatus(l.status))
      ).length,
      proposal: leads.filter((l) =>
        ["proposal_sent", "negotiation", "won"].includes(normalizeLeadStatus(l.status))
      ).length,
      negotiation: leads.filter((l) =>
        ["negotiation", "won"].includes(normalizeLeadStatus(l.status))
      ).length,
      won: leads.filter((l) => normalizeLeadStatus(l.status) === "won").length,
    };

    const leadsBySource: Record<string, number> = {};
    for (const l of leads) {
      const src = (l.source as LeadSource) || "other";
      leadsBySource[src] = (leadsBySource[src] ?? 0) + 1;
    }

    const dealsByStage: Record<string, number> = {};
    for (const d of deals) {
      const stage = normalizeDealStage(d.stage);
      dealsByStage[stage] = (dealsByStage[stage] ?? 0) + 1;
    }

    const revenueByMonth: Record<string, number> = {};
    for (const d of wonDeals) {
      const key = d.updatedAt?.slice(0, 7) ?? "unknown";
      revenueByMonth[key] = (revenueByMonth[key] ?? 0) + d.amount;
    }

    const conversionRate =
      leads.length > 0 ? Math.round((contacts.length / leads.length) * 100) : 0;

    const openTasks = tasks.filter((t) => !["completed", "cancelled"].includes(t.status));

    return {
      kpis: {
        totalLeads: leads.length,
        totalContacts: contacts.length,
        activeDeals: activeDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        expectedRevenue,
        wonRevenue,
        openTasks: openTasks.length,
        conversionRate,
      },
      funnel,
      leadsBySource,
      dealsByStage,
      revenueByMonth,
      teamPerformance: buildTeamPerformance(deals, tasks, leads),
    };
  }, [leadsRes, contactsRes, dealsRes, tasksRes]);
}

function buildTeamPerformance(
  deals: { assignedTo?: string | null; stage: string; amount: number }[],
  tasks: { assigneeId: string | null; status: string }[],
  leads: { assignedTo: string | null; status: string }[]
) {
  const perf: Record<
    string,
    { dealsWon: number; revenue: number; tasksCompleted: number; leadsConverted: number; leadsTotal: number }
  > = {};

  const ensure = (id: string) => {
    if (!perf[id]) perf[id] = { dealsWon: 0, revenue: 0, tasksCompleted: 0, leadsConverted: 0, leadsTotal: 0 };
  };

  for (const d of deals) {
    if (!d.assignedTo) continue;
    ensure(d.assignedTo);
    if (normalizeDealStage(d.stage) === "won") {
      perf[d.assignedTo].dealsWon += 1;
      perf[d.assignedTo].revenue += d.amount;
    }
  }
  for (const t of tasks) {
    if (!t.assigneeId) continue;
    ensure(t.assigneeId);
    if (t.status === "completed") perf[t.assigneeId].tasksCompleted += 1;
  }
  for (const l of leads) {
    if (!l.assignedTo) continue;
    ensure(l.assignedTo);
    perf[l.assignedTo].leadsTotal += 1;
    if (normalizeLeadStatus(l.status) === "won") perf[l.assignedTo].leadsConverted += 1;
  }

  return perf;
}
