import {
  ListTodo,
  Handshake,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type LandingApp = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  gradient: string;
};

export const LANDING_APPS: LandingApp[] = [
  {
    id: "tasks",
    labelKey: "modules.tasks",
    icon: ListTodo,
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    id: "crm",
    labelKey: "modules.crm",
    icon: Handshake,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "people",
    labelKey: "modules.people",
    icon: Users,
    gradient: "from-orange-500 to-amber-600",
  },
  {
    id: "billing",
    labelKey: "modules.billing",
    icon: CreditCard,
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "invoices",
    labelKey: "modules.invoices",
    icon: FileText,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    id: "reports",
    labelKey: "modules.reports",
    icon: BarChart3,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "settings",
    labelKey: "modules.settings",
    icon: Settings,
    gradient: "from-slate-500 to-zinc-600",
  },
];
