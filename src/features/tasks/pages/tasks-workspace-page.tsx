import { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Kanban, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksUIStore } from "../store/tasks-ui.store";
import { TasksWorkspaceFilters } from "../components/tasks-workspace-filters";
import { TasksListView } from "../components/tasks-list-view";
import { KanbanBoard } from "../components/kanban-board";
import {
  TasksPageHeader,
  TasksShell,
  TasksTabBar,
} from "../components/tasks-ui";

const WORK_BASE = "/tasks/work";

export function TasksWorkspacePage() {
  const { t } = useTranslation("tasks");
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

  const viewTabs = [
    {
      key: "board",
      label: t("workspace.views.board"),
      path: WORK_BASE,
      icon: Kanban,
      active: isBoard,
    },
    {
      key: "list",
      label: t("workspace.views.list"),
      path: `${WORK_BASE}/list`,
      icon: List,
      active: isList,
    },
  ] as const;

  return (
    <div
      className={cn(
        "animate-in fade-in duration-300",
        isBoard && "flex h-[calc(100dvh-var(--header-height)-2rem)] flex-col"
      )}
    >
      <TasksPageHeader
        title={t("workspace.title")}
        description={t("workspace.subtitle")}
        breadcrumbLabel={t("nav.dashboard")}
        breadcrumbTo="/tasks"
      />

      <TasksShell
        className={cn(isBoard && "flex min-h-0 flex-1 flex-col")}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <TasksTabBar
              tabs={viewTabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                icon: tab.icon,
                active: tab.active,
                to: tab.path,
              }))}
            />
            <div className="ms-auto flex shrink-0 items-center gap-2">
              <TasksWorkspaceFilters compact={isBoard} />
              <Button
                as={Link}
                to="/tasks/new"
                size="sm"
                color="primary"
                className="font-semibold"
                startContent={<Plus className="h-4 w-4" />}
              >
                {t("list.newTask")}
              </Button>
            </div>
          </div>
        }
      >
        <div
          className={cn(
            isBoard ? "-mx-1 -mb-1 flex min-h-0 flex-1 flex-col px-1" : "-mx-1 px-1"
          )}
        >
          {isBoard ? <KanbanBoard /> : <TasksListView />}
        </div>
      </TasksShell>
    </div>
  );
}
