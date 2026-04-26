import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import { Button, Tooltip } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

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
  // {
  //   labelKey: "nav.taskBoard",
  //   path: "/tasks/board",
  //   icon: <Kanban className="h-5 w-5" />,
  // },
];

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const isRtl = i18n.language === "ar";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-default-100 bg-sidebar text-sidebar-foreground transition-all duration-300 shadow-premium",
        sidebarCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center border-b border-default-100 px-4">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold truncate text-gradient">
            {t("appName")}
          </span>
        )}
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          className={cn(
            "h-8 w-8 shrink-0 bg-default-100/50 hover:bg-default-200/50 transition-all",
            !sidebarCollapsed && (isRtl ? "mr-auto" : "ml-auto"),
          )}
          onPress={toggleSidebar}
        >
          {sidebarCollapsed ? (
            isRtl ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )
          ) : isRtl ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            isDisabled={!sidebarCollapsed}
            content={t(item.labelKey)}
            placement={isRtl ? "left" : "right"}
          >
            <div className="w-full">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300",
                    "hover:bg-default-100/80 hover:scale-[1.02] active:scale-[0.98]",
                    isActive
                      ? "bg-primary text-secondary shadow-glow opacity-100"
                      : "text-default-500 hover:bg-default-100",
                    sidebarCollapsed && "justify-center px-0",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "transition-all duration-300",
                        "group-hover:scale-110",
                        isActive && "scale-110 text-white",
                      )}
                    >
                      {item.icon}
                    </div>
                    {!sidebarCollapsed && (
                      <span
                        className={cn(
                          "truncate font-bold tracking-tight",
                          isActive ? "text-white" : "text-default-700",
                        )}
                      >
                        {t(item.labelKey)}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}
