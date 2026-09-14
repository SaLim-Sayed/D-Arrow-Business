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
  ScrollText,
  Calendar,
  CheckSquare,
  Timer,
  TrendingUp,
  MapPin,
  Settings,
  Package,
  BookCopy,
  BookA,
  FileSpreadsheet,
  ReceiptText,
  PieChart,
  LayoutGrid,
  HandCoins,
  Banknote,
  Wallet,
  Inbox,
  Layers,
  Landmark,
  HardDrive,
  Lock,
  ClipboardCheck,
  ShieldCheck,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface PortalNavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
  namespace?: "common" | "crm" | "billing" | "chat";
  /** If set, item is shown only when the user has this permission. */
  permission?: import("@/lib/permissions").Permission;
}

export interface PortalNavTreeGroup {
  id: string;
  labelKey: string;
  icon?: LucideIcon;
  namespace?: "common" | "crm" | "billing" | "chat";
  items: PortalNavItem[];
}

export const TASKS_NAV_TREE: PortalNavTreeGroup[] = [
  {
    id: "general",
    labelKey: "nav.general",
    icon: LayoutDashboard,
    items: [
      { labelKey: "nav.dashboard", path: "/tasks", icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: "work_sprints",
    labelKey: "nav.work_management",
    icon: ListTodo,
    items: [
      { labelKey: "nav.tasks", path: "/tasks/work", icon: ListTodo },
      { labelKey: "nav.sprints", path: "/tasks/sprints", icon: Clock },
      { labelKey: "nav.daily_reports", path: "/tasks/daily-reports", icon: ClipboardCheck },
    ],
  },
];

export const CRM_NAV_TREE: PortalNavTreeGroup[] = [
  {
    id: "general",
    labelKey: "nav.general",
    icon: LayoutDashboard,
    namespace: "crm",
    items: [
      { labelKey: "nav.dashboard", path: "/crm", icon: LayoutDashboard, end: true, namespace: "crm" },
    ],
  },
  {
    id: "deals_leads",
    labelKey: "nav.pipeline_management",
    icon: Handshake,
    namespace: "crm",
    items: [
      { labelKey: "nav.leads", path: "/crm/leads", icon: UserPlus, namespace: "crm" },
      { labelKey: "nav.contacts", path: "/crm/contacts", icon: Users, namespace: "crm" },
      { labelKey: "nav.deals", path: "/crm/deals", icon: Handshake, namespace: "crm" },
      { labelKey: "nav.crmTasks", path: "/crm/tasks", icon: ListTodo, namespace: "crm" },
    ],
  },
  {
    id: "contracts_reports",
    labelKey: "nav.documents_reports",
    icon: FileText,
    namespace: "crm",
    items: [
      { labelKey: "nav.quotations", path: "/crm/quotations", icon: FileText, namespace: "crm" },
      {
        labelKey: "nav.contracts",
        path: "/crm/contracts",
        icon: ScrollText,
        namespace: "crm",
        permission: "crm.manage_contracts",
      },
      { labelKey: "nav.client_reports", path: "/crm/client-reports", icon: ClipboardCheck, namespace: "crm" },
      { labelKey: "nav.reports", path: "/crm/reports", icon: BarChart3, namespace: "crm" },

    ],
  },
];

export const PEOPLE_NAV_TREE: PortalNavTreeGroup[] = [
  {
    id: "general",
    labelKey: "nav.general",
    icon: LayoutDashboard,
    items: [
      { labelKey: "nav.dashboard", path: "/people", icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: "attendance_leave",
    labelKey: "nav.time_attendance",
    icon: Calendar,
    items: [
      { labelKey: "nav.leave", path: "/people/leave", icon: Calendar },
      { labelKey: "nav.approvals", path: "/people/approvals", icon: CheckSquare },
      { labelKey: "nav.timesheets", path: "/people/timesheets", icon: Timer },
      { labelKey: "nav.daily_reports", path: "/people/daily-reports", icon: ClipboardCheck },
    ],
  },
  {
    id: "performance",
    labelKey: "nav.performance_management",
    icon: TrendingUp,
    items: [
      { labelKey: "nav.performance", path: "/people/performance", icon: TrendingUp },
    ],
  },
  {
    id: "team_settings",
    labelKey: "nav.team_and_roles",
    icon: Settings,
    items: [
      {
        labelKey: "nav.team_members",
        path: "/people/team",
        icon: Users,
        permission: "users.manage_roles",
      },
      {
        labelKey: "nav.roles_permissions",
        path: "/people/roles",
        icon: ShieldCheck,
        permission: "users.manage_roles",
      },
      {
        labelKey: "nav.attendance_settings",
        path: "/people/attendance-settings",
        icon: MapPin,
        permission: "people.manage_employees",
      },
      {
        labelKey: "nav.company_settings",
        path: "/people/company-settings",
        icon: Building2,
        permission: "company.manage",
      },
    ],
  },
];

export const BILLING_NAV_TREE: PortalNavTreeGroup[] = [
  {
    id: "general",
    labelKey: "nav.home",
    icon: LayoutGrid,
    namespace: "billing",
    items: [
      { labelKey: "nav.home", path: "/billing", icon: LayoutGrid, end: true, namespace: "billing" },
      { labelKey: "nav.overview", path: "/billing/overview", icon: LayoutDashboard, namespace: "billing" },
    ],
  },
  {
    id: "sales",
    labelKey: "nav.sales_revenue",
    icon: FileSpreadsheet,
    namespace: "billing",
    items: [
      { labelKey: "nav.invoices", path: "/billing/invoices", icon: FileSpreadsheet, namespace: "billing" },
      { labelKey: "nav.receipt_vouchers", path: "/billing/receipt-vouchers", icon: Banknote, namespace: "billing" },
      { labelKey: "nav.credit_notes", path: "/billing/credit-notes", icon: ScrollText, namespace: "billing" },
    ],
  },
  {
    id: "purchases",
    labelKey: "nav.purchases_expenses",
    icon: ReceiptText,
    namespace: "billing",
    items: [
      { labelKey: "nav.bills", path: "/billing/bills", icon: ReceiptText, namespace: "billing" },
      { labelKey: "nav.payment_vouchers", path: "/billing/payment-vouchers", icon: Wallet, namespace: "billing" },
    ],
  },
  {
    id: "reports_tax",
    labelKey: "nav.reports_tax_centers",
    icon: PieChart,
    namespace: "billing",
    items: [
      { labelKey: "nav.reports", path: "/billing/reports", icon: PieChart, namespace: "billing" },
      { labelKey: "nav.vat_return", path: "/billing/vat-return", icon: FileText, namespace: "billing" },
      { labelKey: "nav.bank_reconciliation", path: "/billing/bank-reconciliation", icon: Landmark, namespace: "billing" },
      { labelKey: "nav.statement_of_account", path: "/billing/statement-of-account", icon: BarChart3, namespace: "billing" },
      { labelKey: "nav.cost_centers", path: "/billing/cost-centers", icon: Layers, namespace: "billing" },
      { labelKey: "nav.zakat", path: "/billing/zakat", icon: HandCoins, namespace: "billing" },
    ],
  },
  {
    id: "chart_accounts",
    labelKey: "nav.chart_products_settings",
    icon: BookCopy,
    namespace: "billing",
    items: [
      { labelKey: "nav.products", path: "/billing/products", icon: Package, namespace: "billing" },
      { labelKey: "nav.fixed_assets", path: "/billing/fixed-assets", icon: HardDrive, namespace: "billing" },
      { labelKey: "nav.fiscal_closing", path: "/billing/fiscal-closing", icon: Lock, namespace: "billing" },
      { labelKey: "nav.journals", path: "/billing/journals", icon: BookA, namespace: "billing" },
      { labelKey: "nav.accounts", path: "/billing/accounts", icon: BookCopy, namespace: "billing" },
      { labelKey: "nav.settings", path: "/billing/settings", icon: Settings, namespace: "billing" },
    ],
  },
];

export const CHAT_NAV_TREE: PortalNavTreeGroup[] = [
  {
    id: "general",
    labelKey: "nav.messages",
    icon: Inbox,
    namespace: "chat",
    items: [
      { labelKey: "nav.inbox", path: "/chat", icon: Inbox, end: true, namespace: "chat" },
    ],
  },
];

export const TASKS_NAV = TASKS_NAV_TREE.flatMap((g) => g.items);
export const CRM_NAV = CRM_NAV_TREE.flatMap((g) => g.items);
export const PEOPLE_NAV = PEOPLE_NAV_TREE.flatMap((g) => g.items);
export const BILLING_NAV = BILLING_NAV_TREE.flatMap((g) => g.items);
export const CHAT_NAV = CHAT_NAV_TREE.flatMap((g) => g.items);

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
    case "chat":
      return CHAT_NAV;
    default:
      return [];
  }
}

export function getNavTreeForPortal(portal: PortalId): PortalNavTreeGroup[] {
  switch (portal) {
    case "tasks":
      return TASKS_NAV_TREE;
    case "crm":
      return CRM_NAV_TREE;
    case "people":
      return PEOPLE_NAV_TREE;
    case "billing":
      return BILLING_NAV_TREE;
    case "chat":
      return CHAT_NAV_TREE;
    default:
      return [];
  }
}
