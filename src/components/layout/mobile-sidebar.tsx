import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "../shared/logo";
import { LanguageSwitcherRow } from "./language-switcher";
import { getPortalFromPath } from "@/lib/portal-permissions";
import { getNavForPortal } from "@/lib/portal-nav";
import { useAccessiblePortals } from "@/features/portals/hooks/use-portals";

export function MobileSidebar() {
  const { t } = useTranslation();
  const { t: tCrm } = useTranslation("crm");
  const { setMobileSidebarOpen, setPortalPickerOpen } = useLayoutStore();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const portal = getPortalFromPath(location.pathname);

  const navItems =
    portal === "tasks" || portal === "crm" || portal === "people"
      ? getNavForPortal(portal)
      : [];

  const portalTitle =
    portal === "tasks"
      ? t("portals.tasks.short")
      : portal === "crm"
        ? t("portals.crm.short")
        : portal === "people"
          ? t("portals.people.short")
          : t("appName");

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-default-100 px-4">
        <Logo size="sm" variant="icon" className="shrink-0" />
        {navItems.length > 0 && (
          <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
            {portalTitle}
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const label =
            item.namespace === "crm" ? tCrm(item.labelKey) : t(item.labelKey);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300",
                  "hover:bg-default-100/80 active:scale-[0.98]",
                  isActive
                    ? "bg-primary text-white shadow-glow"
                    : "text-default-500"
                )
              }
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  "group-[.active]:text-white"
                )}
              />
              <span className="font-bold tracking-tight">{label}</span>
            </NavLink>
          );
        })}
      </nav>
      {portals.length > 1 && (
        <div className="border-t border-default-100 p-4">
          <button
            type="button"
            onClick={() => {
              setMobileSidebarOpen(false);
              setPortalPickerOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-default-500 hover:bg-default-100 transition-all"
          >
            <LayoutGrid className="h-5 w-5" />
            <span>{t("portals.allApps")}</span>
          </button>
        </div>
      )}
      <div className="border-t border-default-100 p-4">
        <LanguageSwitcherRow onToggle={() => setMobileSidebarOpen(false)} />
      </div>
    </div>
  );
}
