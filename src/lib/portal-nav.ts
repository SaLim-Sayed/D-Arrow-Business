import type { PortalId } from "@/lib/portal-permissions";
import {
  LayoutDashboard,
  Kanban,
  ListTodo,
  Clock,
  UserPlus,
  Users,
  Handshake,
  BarChart3,
  FileText,
  Calendar,
  CheckSquare,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface PortalNavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
  namespace?: "common" | "crm";
}

export const TASKS_NAV: PortalNavItem[] = [
  { labelKey: "nav.dashboard", path: "/tasks", icon: LayoutDashboard, end: true },
  { labelKey: "nav.taskList", path: "/tasks/list", icon: ListTodo },
  { labelKey: "nav.taskBoard", path: "/tasks/board", icon: Kanban },
  { labelKey: "nav.sprints", path: "/tasks/sprints", icon: Clock },
];

export const CRM_NAV: PortalNavItem[] = [
  { labelKey: "nav.dashboard", path: "/crm", icon: LayoutDashboard, end: true, namespace: "crm" },
  { labelKey: "nav.leads", path: "/crm/leads", icon: UserPlus, namespace: "crm" },
  { labelKey: "nav.contacts", path: "/crm/contacts", icon: Users, namespace: "crm" },
  { labelKey: "nav.deals", path: "/crm/deals", icon: Handshake, namespace: "crm" },
  { labelKey: "nav.crmTasks", path: "/crm/tasks", icon: ListTodo, namespace: "crm" },
  { labelKey: "nav.quotations", path: "/crm/quotations", icon: FileText, namespace: "crm" },
  { labelKey: "nav.reports", path: "/crm/reports", icon: BarChart3, namespace: "crm" },
];

export const PEOPLE_NAV: PortalNavItem[] = [
  { labelKey: "nav.dashboard", path: "/people", icon: LayoutDashboard, end: true },
  { labelKey: "nav.leave", path: "/people/leave", icon: Calendar },
  { labelKey: "nav.approvals", path: "/people/approvals", icon: CheckSquare },
  { labelKey: "nav.timesheets", path: "/people/timesheets", icon: Timer },
  { labelKey: "nav.performance", path: "/people/performance", icon: TrendingUp },
];

export function getNavForPortal(portal: PortalId): PortalNavItem[] {
  switch (portal) {
    case "tasks":
      return TASKS_NAV;
    case "crm":
      return CRM_NAV;
    case "people":
      return PEOPLE_NAV;
    default:
      return [];
  }
}
