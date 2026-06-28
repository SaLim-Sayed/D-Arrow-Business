import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { TaskStatsCards } from "../components/task-stats-cards";
import { TaskCharts } from "../components/task-chart";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@heroui/react";
import { CalendarRange, Kanban, Plus, List } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTasksWorkspaceNavigation } from "../hooks/use-tasks-workspace-navigation";
import type { TaskStatus } from "../types/task.types";
import {
  TasksPageHeader,
  TasksPanel,
} from "../components/tasks-ui";

export function TasksDashboardPage() {
  const { t } = useTranslation("tasks");
  const { data, isLoading } = useAllTasksQuery();
  const { openAllTasks, openByStatus } = useTasksWorkspaceNavigation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const tasks = data?.data ?? [];
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <TasksPageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      <TaskStatsCards tasks={tasks} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TasksPanel title={t("dashboard.quickActions")}>
          <div className="flex flex-col gap-2">
            <Button
              as={Link}
              to="/tasks/new"
              color="primary"
              size="sm"
              className="justify-start font-semibold"
              startContent={<Plus className="h-4 w-4" />}
            >
              {t("list.newTask")}
            </Button>
            <Button
              as={Link}
              to="/tasks/work"
              size="sm"
              variant="flat"
              className="justify-start font-medium"
              startContent={<Kanban className="h-4 w-4" />}
            >
              {t("dashboard.openBoard")}
            </Button>
            <Button
              as={Link}
              to="/tasks/work/list"
              size="sm"
              variant="flat"
              className="justify-start font-medium"
              startContent={<List className="h-4 w-4" />}
            >
              {t("dashboard.openList")}
            </Button>
            <Button
              as={Link}
              to="/tasks/sprints"
              size="sm"
              variant="flat"
              className="justify-start font-medium"
              startContent={<CalendarRange className="h-4 w-4" />}
            >
              {t("dashboard.openSprints")}
            </Button>
          </div>
        </TasksPanel>

        <div className="lg:col-span-2">
          <TaskCharts tasks={tasks} />
        </div>
      </div>

      <div className="mt-4">
        <TasksPanel
          title={t("dashboard.recentTasks")}
          action={
            <Button
              size="sm"
              variant="light"
              className="h-7 min-w-0 px-2 text-xs"
              onPress={() => openAllTasks()}
            >
              {t("dashboard.viewAll")}
            </Button>
          }
        >
          {recentTasks.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-8 text-sm text-default-400">
              {t("dashboard.noRecent")}
            </p>
          ) : (
            <div className="-mx-1 divide-y divide-default-100">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between gap-3 px-1 py-2.5 transition-colors hover:bg-primary/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-default-900">
                      {task.title}
                    </p>
                    <p className="text-xs text-default-500">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openByStatus(task.status as TaskStatus);
                    }}
                    className={cn("shrink-0")}
                  >
                    <StatusBadge status={task.status} />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </TasksPanel>
      </div>
    </div>
  );
}
