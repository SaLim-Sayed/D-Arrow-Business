import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Handshake,
  ListTodo,
  BarChart3,
} from "lucide-react";
import { useCrmPermissions } from "../hooks/use-crm-permissions";

const links: {
  path: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}[] = [
  { path: "/crm", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { path: "/crm/leads", labelKey: "nav.leads", icon: UserPlus },
  { path: "/crm/contacts", labelKey: "nav.contacts", icon: Users },
  { path: "/crm/deals", labelKey: "nav.deals", icon: Handshake },
  { path: "/crm/tasks", labelKey: "nav.crmTasks", icon: ListTodo },
  { path: "/crm/reports", labelKey: "nav.reports", icon: BarChart3 },
];

export function CrmSubNav() {
  const { t } = useTranslation("crm");
  const { canViewCrm } = useCrmPermissions();

  if (!canViewCrm) return null;

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {links.map(({ path, labelKey, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) =>
            cn(
              "shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-default-600 hover:bg-default-100"
            )
          }
        >
          <Icon className="w-4 h-4" />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
