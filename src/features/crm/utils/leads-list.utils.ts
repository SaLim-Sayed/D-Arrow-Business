import { normalizeLeadStatus } from "../constants/lead-workflow";
import type { Lead } from "../types/leads.types";
import type { LeadSortField, LeadSortOrder } from "../constants/lead-workflow";

export interface LeadsListParams {
  search?: string;
  status?: string[];
  source?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sortField?: LeadSortField;
  sortOrder?: LeadSortOrder;
  page?: number;
  pageSize?: number;
}

function leadMatchesSearch(lead: Lead, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [lead.name, lead.company, lead.email, lead.phone, lead.notes]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

function leadInDateRange(lead: Lead, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const created = new Date(lead.createdAt).getTime();
  if (from && created < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && created > new Date(to).setHours(23, 59, 59, 999)) return false;
  return true;
}

export function filterLeads(leads: Lead[], params: LeadsListParams): Lead[] {
  return leads
    .map((l) => ({ ...l, status: normalizeLeadStatus(l.status) }))
    .filter((lead) => {
      if (params.search && !leadMatchesSearch(lead, params.search)) return false;
      if (params.status?.length && !params.status.includes(lead.status)) return false;
      if (params.source && lead.source !== params.source) return false;
      if (params.assignedTo === "__unassigned__" && lead.assignedTo) return false;
      if (params.assignedTo && params.assignedTo !== "__unassigned__" && lead.assignedTo !== params.assignedTo)
        return false;
      if (!leadInDateRange(lead, params.dateFrom, params.dateTo)) return false;
      return true;
    });
}

export function sortLeads(
  leads: Lead[],
  field: LeadSortField = "createdAt",
  order: LeadSortOrder = "desc"
): Lead[] {
  const dir = order === "asc" ? 1 : -1;
  return [...leads].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (field) {
      case "name":
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        break;
      case "company":
        av = (a.company || "").toLowerCase();
        bv = (b.company || "").toLowerCase();
        break;
      case "status":
        av = a.status;
        bv = b.status;
        break;
      case "createdAt":
      default:
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
        break;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

export function paginateLeads<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  };
}

export function applyLeadsListPipeline(leads: Lead[], params: LeadsListParams) {
  const filtered = filterLeads(leads, params);
  const sorted = sortLeads(filtered, params.sortField, params.sortOrder);
  return paginateLeads(sorted, params.page ?? 1, params.pageSize ?? 10);
}
