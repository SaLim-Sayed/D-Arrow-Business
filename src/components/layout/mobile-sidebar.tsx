import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout.store";
import { Kanban, LayoutDashboard, ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

const navItems = [
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

export function MobileSidebar() {
  const { t } = useTranslation();
  const { setMobileSidebarOpen } = useLayoutStore();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold">{t("appName")}</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70",
              )
            }
          >
            {item.icon}
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
