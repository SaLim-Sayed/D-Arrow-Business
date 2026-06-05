import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import { Button, Tooltip } from "@heroui/react";
import { Logo } from "../shared/logo";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import type { PortalId } from "@/lib/portal-permissions";
import { getNavForPortal } from "@/lib/portal-nav";
import { useAccessiblePortals } from "@/features/portals/hooks/use-portals";

const PORTAL_META: Record<PortalId, { titleKey: string }> = {
  tasks: { titleKey: "portals.tasks.short" },
  crm: { titleKey: "portals.crm.short" },
  people: { titleKey: "portals.people.short" },
};

interface PortalSidebarProps {
  portal: PortalId;
}

export function PortalSidebar({ portal }: PortalSidebarProps) {
  const { t, i18n } = useTranslation();
  const { t: tCrm } = useTranslation("crm");
  const { sidebarCollapsed, toggleSidebar, setPortalPickerOpen } = useLayoutStore();
  const navItems = getNavForPortal(portal);
  const meta = PORTAL_META[portal];
  const isRtl = i18n.language === "ar";
  const portals = useAccessiblePortals();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-30 hidden md:flex flex-col",
        "border-r border-default-100 bg-sidebar text-sidebar-foreground",
        "transition-all duration-300 shadow-premium overflow-y-auto",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className={cn(
          "relative flex border-b border-default-100 transition-all duration-300",
          sidebarCollapsed
            ? "h-auto flex-col items-center gap-2 py-4 px-2"
            : "h-20 items-center justify-between gap-2 px-4"
        )}
      >
        {sidebarCollapsed ? (
          <>
            <Tooltip
              content={t(meta.titleKey)}
              placement={isRtl ? "left" : "right"}
            >
              <Logo size="sm" variant="icon" className="w-10 shrink-0" />
            </Tooltip>
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              className="h-8 w-8 shrink-0 bg-default-100/50 hover:bg-default-200/50"
              onPress={toggleSidebar}
            >
              {isRtl ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Logo size="sm" variant="full" className="w-full min-w-[240px] h-20" />
              <span className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
                {t(meta.titleKey)}
              </span>
            </div>
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              className={cn(
                "h-8 w-8 shrink-0 bg-default-100/50 hover:bg-default-200/50",
                isRtl ? "mr-auto" : "ml-auto"
              )}
              onPress={toggleSidebar}
            >
              {isRtl ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label =
            item.namespace === "crm" ? tCrm(item.labelKey) : t(item.labelKey);

          return (
            <Tooltip
              key={item.path}
              isDisabled={!sidebarCollapsed}
              content={label}
              placement={isRtl ? "left" : "right"}
            >
              <div className="w-full">
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300",
                      "hover:bg-default-100/80 hover:scale-[1.02] active:scale-[0.98]",
                      isActive
                        ? "bg-primary text-secondary shadow-glow opacity-100"
                        : "text-default-500 hover:bg-default-100",
                      sidebarCollapsed && "justify-center px-0"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={cn(
                          "transition-all duration-300 group-hover:scale-110",
                          isActive && "scale-110 text-white"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {!sidebarCollapsed && (
                        <span
                          className={cn(
                            "truncate font-bold tracking-tight",
                            isActive ? "text-white" : "text-default-700"
                          )}
                        >
                          {label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            </Tooltip>
          );
        })}
      </nav>

      {portals.length > 1 && (
        <div className="border-t border-default-100 p-4">
          <Tooltip
            isDisabled={!sidebarCollapsed}
            content={t("portals.allApps")}
            placement={isRtl ? "left" : "right"}
          >
            <button
              type="button"
              onClick={() => setPortalPickerOpen(true)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                "text-default-500 hover:bg-default-100",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <LayoutGrid className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{t("portals.allApps")}</span>
              )}
            </button>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
