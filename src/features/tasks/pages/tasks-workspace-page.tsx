import { useEffect } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Kanban, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/auth-context";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { TasksWorkspaceFilters } from "../components/tasks-workspace-filters";
import { TasksListView } from "../components/tasks-list-view";
import { KanbanBoard } from "../components/kanban-board";

const WORK_BASE = "/tasks/work";

export function TasksWorkspacePage() {
  const { t } = useTranslation("tasks");
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setFilter } = useTasksUIStore();

  const isList = location.pathname.endsWith("/list");
  const isBoard = !isList;

  useEffect(() => {
    const sprintId = searchParams.get("sprintId");
    if (sprintId) {
      setFilter("sprintId", sprintId);
    }
  }, [searchParams, setFilter]);

  const companyName = user?.companyName || "D-Arrow Business";
  const [firstPart, ...rest] = companyName.split(" ");
  const secondPart = rest.join(" ");

  const viewTabs = [
    { key: "board", label: t("workspace.views.board"), path: WORK_BASE, icon: Kanban },
    { key: "list", label: t("workspace.views.list"), path: `${WORK_BASE}/list`, icon: List },
  ] as const;

  return (
    <div
      className={cn(
        "animate-in fade-in duration-500",
        isBoard && "h-[calc(100dvh-var(--header-height))] flex flex-col bg-background"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-6 border-b border-default-100 dark:border-default-50/20",
          isBoard ? "px-8 pt-8 pb-4" : "pb-4"
        )}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col min-w-0">
            <nav className="flex items-center gap-1 text-[10px] font-bold text-default-400 uppercase tracking-widest mb-2">
              <span>{firstPart.toUpperCase()}-</span>
              <span className="text-primary/70">{secondPart.toUpperCase()}</span>
              <span className="mx-1 text-default-300">/</span>
              <span className="text-default-900 dark:text-default-100">{t("workspace.title")}</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-default-900 dark:text-white">
              {t("workspace.title")}
            </h1>
          </div>

          <Link
            to="/tasks/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3px]" />
            {t("list.newTask")}
          </Link>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-default-100/80 w-fit">
            {viewTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  end={tab.key === "board"}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      isActive
                        ? "bg-background text-primary shadow-sm"
                        : "text-default-500 hover:text-default-900"
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>

          <TasksWorkspaceFilters compact={isBoard} />
        </div>
      </div>

      <div className={cn(isBoard ? "flex-1 overflow-hidden p-8" : "pt-4")}>
        {isBoard ? <KanbanBoard /> : <TasksListView />}
      </div>
    </div>
  );
}
