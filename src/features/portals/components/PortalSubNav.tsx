import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getNavForPortal } from "@/lib/portal-nav";
import type { PortalId } from "@/lib/portal-permissions";

interface PortalSubNavProps {
  portal: PortalId;
}

export function PortalSubNav({ portal }: PortalSubNavProps) {
  const { t } = useTranslation();
  const { t: tCrm } = useTranslation("crm");
  const links = getNavForPortal(portal);

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {links.map(({ path, labelKey, icon: Icon, end, namespace }) => (
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
          {namespace === "crm" ? tCrm(labelKey) : t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
