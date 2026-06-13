import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Building2, Tags, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useAppPermissions } from "../hooks/use-app-permissions";

const SETTINGS_NAV = [
  {
    path: "/settings/company",
    labelKey: "nav.company",
    icon: Building2,
    permission: "company.view" as const,
  },
  {
    path: "/settings/pricing",
    labelKey: "nav.pricing",
    icon: Tags,
    permission: "pricing.view" as const,
  },
  {
    path: "/settings/team",
    labelKey: "nav.team",
    icon: Users,
    permission: "users.manage_roles" as const,
  },
  {
    path: "/settings/roles",
    labelKey: "nav.roles",
    icon: Shield,
    permission: "users.manage_roles" as const,
  },
];

export function SettingsLayout() {
  const { t } = useTranslation("settings");
  const { can } = useAppPermissions();
  const items = SETTINGS_NAV.filter((item) => can(item.permission));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <nav className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-glow"
                    : "bg-default-100 text-default-600 hover:bg-default-200"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </NavLink>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
