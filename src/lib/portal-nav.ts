import type { PortalId } from "@/lib/portal-permissions";
import {
  LayoutDashboard,
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
  Settings,
  Package,
  BookCopy,
  BookA,
  FileSpreadsheet,
  ReceiptText,
  PieChart,
  LayoutGrid,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

export interface PortalNavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
  namespace?: "common" | "crm" | "billing";
}

export const TASKS_NAV: PortalNavItem[] = [
  { labelKey: "nav.dashboard", path: "/tasks", icon: LayoutDashboard, end: true },
  { labelKey: "nav.tasks", path: "/tasks/work", icon: ListTodo },
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

export const BILLING_NAV: PortalNavItem[] = [
  { labelKey: "nav.home", path: "/billing", icon: LayoutGrid, end: true, namespace: "billing" },
  { labelKey: "nav.overview", path: "/billing/overview", icon: LayoutDashboard, namespace: "billing" },
  { labelKey: "nav.invoices", path: "/billing/invoices", icon: FileSpreadsheet, namespace: "billing" },
  { labelKey: "nav.bills", path: "/billing/bills", icon: ReceiptText, namespace: "billing" },
  { labelKey: "nav.reports", path: "/billing/reports", icon: PieChart, namespace: "billing" },
  { labelKey: "nav.products", path: "/billing/products", icon: Package, namespace: "billing" },
  { labelKey: "nav.journals", path: "/billing/journals", icon: BookA, namespace: "billing" },
  { labelKey: "nav.accounts", path: "/billing/accounts", icon: BookCopy, namespace: "billing" },
  { labelKey: "nav.zakat", path: "/billing/zakat", icon: HandCoins, namespace: "billing" },
  { labelKey: "nav.settings", path: "/billing/settings", icon: Settings, namespace: "billing" },
];

export function getNavForPortal(portal: PortalId): PortalNavItem[] {
  switch (portal) {
    case "tasks":
      return TASKS_NAV;
    case "crm":
      return CRM_NAV;
    case "people":
      return PEOPLE_NAV;
    case "billing":
      return BILLING_NAV;
    default:
      return [];
  }
}
