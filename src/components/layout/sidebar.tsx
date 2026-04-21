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
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    labelKey: "nav.taskList",
    path: "/tasks/list",
    icon: <ListTodo className="h-5 w-5" />,
  },
  {
    labelKey: "nav.taskBoard",
    path: "/tasks/board",
    icon: <Kanban className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const isRtl = i18n.language === "ar";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-e bg-sidebar text-sidebar-foreground transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center border-b px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold truncate">
            {t("appName")}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", !sidebarCollapsed && "ms-auto")}
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
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70",
                    sidebarCollapsed && "justify-center px-2"
                  )
                }
              >
                {item.icon}
                {!sidebarCollapsed && <span>{t(item.labelKey)}</span>}
              </NavLink>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side={isRtl ? "left" : "right"}>
                {t(item.labelKey)}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}
