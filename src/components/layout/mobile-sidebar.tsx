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
  const { t: tBilling } = useTranslation("billing");
  const { t: tChat } = useTranslation("chat");
  const { setMobileSidebarOpen, setPortalPickerOpen } = useLayoutStore();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const portal = getPortalFromPath(location.pathname);

  const navItems =
    portal === "tasks" ||
    portal === "crm" ||
    portal === "people" ||
    portal === "billing" ||
    portal === "chat"
      ? getNavForPortal(portal)
      : [];

  const portalTitle =
    portal === "tasks"
      ? t("portals.tasks.short")
      : portal === "crm"
        ? t("portals.crm.short")
        : portal === "people"
          ? t("portals.people.short")
          : portal === "billing"
            ? t("portals.billing.short")
            : portal === "chat"
              ? t("portals.chat.short")
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
            item.namespace === "crm"
              ? tCrm(item.labelKey)
              : item.namespace === "billing"
                ? tBilling(item.labelKey)
                : item.namespace === "chat"
                  ? tChat(item.labelKey)
                  : t(item.labelKey);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300",
                  "active:scale-[0.98]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "text-default-600 hover:bg-default-100 hover:text-default-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-default-500 group-hover:text-default-900"
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold tracking-tight",
                      isActive
                        ? "text-primary-foreground"
                        : "text-default-700 group-hover:text-default-900"
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
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
