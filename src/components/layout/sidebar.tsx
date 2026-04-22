import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    labelKey: "nav.dashboard",
    path: "/tasks/dashboard",

    icon: <LayoutDashboard className="h-5 w-5 text-blue-700" />,
  },
  {
    labelKey: "nav.taskList",
    path: "/tasks/list",
    icon: <ListTodo className="h-5 w-5 text-blue-700" />,
  },
  {
    labelKey: "nav.taskBoard",
    path: "/tasks/board",
    icon: <Kanban className="h-5 w-5 text-blue-700" />,
  },
];

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const isRtl = i18n.language === "ar";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all duration-300 shadow-xl",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("appName")}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", 
            !sidebarCollapsed && "ms-auto"
          )}
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            isRtl ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : isRtl ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-3">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm hover:scale-[1.02]",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
                    sidebarCollapsed && "justify-center px-2.5"
                  )
                }
              >
                <div className={cn(
                  "transition-transform duration-200",
                  "group-hover:scale-110"
                )}>
                  {item.icon}
                </div>
                {!sidebarCollapsed && (
                  <span className="truncate text-blue-700">{t(item.labelKey)}</span>
                )}
              </NavLink>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side={isRtl ? "left" : "right"} className="font-medium">
                {t(item.labelKey)}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}
