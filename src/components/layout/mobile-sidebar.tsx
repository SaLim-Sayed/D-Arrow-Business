import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import { LayoutGrid, Folder, ChevronDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { Logo } from "../shared/logo";
import { LanguageSwitcherRow } from "./language-switcher";
import { getPortalFromPath, type PortalId } from "@/lib/portal-permissions";
import {
  getNavTreeForPortal,
  isPortalNavItemActive,
  type PortalNavTreeGroup,
  type PortalNavItem,
} from "@/lib/portal-nav";
import { useAccessiblePortals } from "@/features/portals/hooks/use-portals";
import { ChatInboxBadge } from "@/features/chat/components/ChatInboxBadge";

const GROUP_TITLES_AR: Record<string, string> = {
  general: "الرئيسية",
  sales: "المبيعات والإيرادات",
  purchases: "المشتريات والمصروفات",
  reports_tax: "التقارير والمراكز المالية",
  chart_accounts: "دليل الحسابات والإعدادات",
  deals_leads: "إدارة العملاء والصفقات",
  contracts_reports: "عروض الأسعار والتقارير",
  attendance_leave: "الحضور والإجازات",
  performance: "تقييم الأداء",
  work_sprints: "إدارة العمل والدورات",
  messages: "المحادثات والرسائل",
};

const GROUP_TITLES_EN: Record<string, string> = {
  general: "Overview",
  sales: "Sales & revenue",
  purchases: "Purchases & expenses",
  reports_tax: "Reports & finance",
  chart_accounts: "Accounts & settings",
  deals_leads: "Leads & deals",
  contracts_reports: "Documents & reports",
  attendance_leave: "Attendance & leave",
  performance: "Performance",
  team_settings: "Team & settings",
  work_sprints: "Work & sprints",
  messages: "Messages",
};

const PORTAL_TITLES_AR: Record<PortalId | "picker" | "settings", string> = {
  billing: "المحاسبة والمالية",
  crm: "إدارة العملاء",
  people: "الموارد البشرية",
  tasks: "إدارة المهام والمشاريع",
  chat: "المحادثات والرسائل",
  picker: "جميع التطبيقات",
  settings: "الإعدادات",
};

export function MobileSidebar() {
  const { t, i18n } = useTranslation();
  const { t: tCrm } = useTranslation("crm");
  const { t: tBilling } = useTranslation("billing");
  const { t: tChat } = useTranslation("chat");
  const { setMobileSidebarOpen, setPortalPickerOpen } = useLayoutStore();
  const location = useLocation();
  const portals = useAccessiblePortals();
  const portal = getPortalFromPath(location.pathname);

  const activePortalId: PortalId =
    portal === "tasks" || portal === "crm" || portal === "people" || portal === "billing" || portal === "chat"
      ? portal
      : "billing";

  const treeGroups = getNavTreeForPortal(activePortalId);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    treeGroups.forEach((g) => {
      init[g.id] = true;
    });
    return init;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getItemLabel = (item: PortalNavItem) => {
    if (item.namespace === "crm") return tCrm(item.labelKey);
    if (item.namespace === "billing") return tBilling(item.labelKey);
    if (item.namespace === "chat") return tChat(item.labelKey);
    return t(item.labelKey);
  };

  const getGroupLabel = (group: PortalNavTreeGroup) => {
    return (i18n.dir() === "rtl" ? GROUP_TITLES_AR : GROUP_TITLES_EN)[group.id] ?? t(group.labelKey);
  };

  const portalTitle = i18n.dir() === "rtl" && portal && PORTAL_TITLES_AR[portal]
    ? PORTAL_TITLES_AR[portal]
    : t(`portals.${activePortalId}.short`, t("appName"));

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden bg-sidebar text-foreground">
      {/* Top Mobile Header */}
      <div className="flex h-16 items-center justify-between border-b border-default-100 px-4 shrink-0 bg-default-50/50">
        <div className="flex items-center gap-3">
          <Logo
            size="sm"
            variant="icon"
            to="/"
            title={t("portals.allApps")}
            className="shrink-0"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <span className="min-w-0 truncate text-xs font-black text-default-900">
            {portalTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="p-1.5 text-default-400 hover:text-default-700 rounded-lg"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Search Bar */}
      <div className="p-3 border-b border-default-100/80 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute start-2.5 h-3.5 w-3.5 text-default-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("actions.search")}
            className="w-full h-8.5 ps-8 pe-8 text-xs font-medium bg-default-100/70 focus:bg-background border border-default-200/70 focus:border-primary/60 rounded-xl outline-none transition-all placeholder:text-default-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute end-2 p-0.5 text-default-400 hover:text-default-700 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Groups Navigation */}
      <nav className="min-h-0 min-w-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto p-3">
        {treeGroups.map((group) => {
          const isExpanded = searchQuery.trim() ? true : expandedGroups[group.id] ?? true;
          const query = searchQuery.toLowerCase().trim();
          const groupLabel = getGroupLabel(group);
          const groupMatch = query ? groupLabel.toLowerCase().includes(query) : true;
          const matchingItems = group.items.filter((item) =>
            query ? getItemLabel(item).toLowerCase().includes(query) : true
          );

          if (query && !groupMatch && matchingItems.length === 0) return null;

          const displayItems = query && !groupMatch ? matchingItems : group.items;
          const containsActiveChild = group.items.some((item) => isPortalNavItemActive(item, location.pathname));
          const GroupIcon = group.icon ?? Folder;

          return (
            <div key={group.id} className="min-w-0 rounded-xl transition-all">
              {/* Group Node Header */}
              <div
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors cursor-pointer select-none",
                  containsActiveChild ? "bg-primary/[0.06] text-primary" : "text-default-600 hover:bg-default-100/80"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <GroupIcon className={cn("h-4 w-4 shrink-0", containsActiveChild ? "text-primary" : "text-default-500")} />
                  <span className={cn("min-w-0 text-xs font-semibold leading-snug", containsActiveChild ? "text-primary" : "text-default-700")}>
                    {groupLabel}
                  </span>
                </div>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 text-default-400 transition-transform duration-200", !isExpanded && "-rotate-90 rtl:rotate-90")}
                />
              </div>

              {/* Sub items branch */}
              {isExpanded && (
                <div className="relative ms-2 min-w-0 space-y-0.5 ps-1 my-1">
                  {displayItems.map((item) => {
                    const Icon = item.icon;
                    const label = getItemLabel(item);

                    return (
                      <div key={item.path} className="relative flex items-center">
                        <NavLink
                          to={item.path}
                          end={item.end}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "relative flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-all",
                              isActive
                                ? "bg-primary/[0.09] font-bold text-primary ring-1 ring-inset ring-primary/20 shadow-sm"
                                : "font-medium text-default-700 hover:bg-default-100/70 hover:text-default-900"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary" aria-hidden="true" />}
                              <span className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                isActive ? "bg-primary/15 text-primary" : "bg-default-100/60 text-default-500"
                              )}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className={cn("min-w-0 flex-1 truncate", isActive ? "font-bold text-primary" : "font-medium text-default-700")}>
                                {label}
                              </span>
                              {item.path === "/chat" && (
                                <ChatInboxBadge className={isActive ? "bg-primary text-primary-foreground" : undefined} />
                              )}
                            </>
                          )}
                        </NavLink>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer apps & language switcher */}
      {portals.length > 1 && (
        <div className="border-t border-default-100 p-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileSidebarOpen(false);
              setPortalPickerOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-default-500 hover:bg-default-100 transition-all"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>{t("portals.allApps")}</span>
          </button>
        </div>
      )}
      <div className="border-t border-default-100 p-3 shrink-0">
        <LanguageSwitcherRow onToggle={() => setMobileSidebarOpen(false)} />
      </div>
    </div>
  );
}
