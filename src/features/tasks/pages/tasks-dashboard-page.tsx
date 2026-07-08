import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { TaskStatsCards } from "../components/task-stats-cards";
import { TaskCharts } from "../components/task-chart";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@heroui/react";
import {
  CalendarRange,
  Kanban,
  LayoutDashboard,
  List,
  ListTodo,
  Plus,
  Target,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTasksWorkspaceNavigation } from "../hooks/use-tasks-workspace-navigation";
import type { TaskStatus } from "../types/task.types";
import {
  TasksAppTile,
  TasksModuleSection,
  TasksPanel,
  TasksQuickAction,
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

  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const activeSprints = new Set(
    tasks.map((task) => task.sprintId).filter(Boolean)
  ).size;

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <div className="mb-5 overflow-hidden rounded-xl border border-default-200 bg-gradient-to-br from-primary/[0.08] via-sky-500/[0.04] to-content1 p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <ListTodo className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-default-900 md:text-3xl">
              {t("landing.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-default-600 md:text-base">
              {t("landing.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <TasksQuickAction
          to="/tasks/new"
          icon={Plus}
          label={t("landing.quick.newTask")}
          color="primary"
        />
        <TasksQuickAction
          to="/tasks/work"
          icon={Kanban}
          label={t("landing.quick.openBoard")}
          color="default"
        />
        <TasksQuickAction
          to="/tasks/work/list"
          icon={List}
          label={t("landing.quick.openList")}
          color="default"
        />
        <TasksQuickAction
          to="/tasks/sprints"
          icon={CalendarRange}
          label={t("landing.quick.openSprints")}
          color="default"
        />
      </div>

      <TaskStatsCards tasks={tasks} />

      <TasksModuleSection
        title={t("landing.sections.work")}
        description={t("landing.sections.work_desc")}
        icon={Kanban}
        iconClassName="bg-primary/10 text-primary"
      >
        <TasksAppTile
          to="/tasks/work"
          icon={Kanban}
          title={t("landing.apps.board.title")}
          description={t("landing.apps.board.desc")}
          badge={openTasks || undefined}
          iconClassName="bg-primary/10 text-primary"
        />
        <TasksAppTile
          to="/tasks/work/list"
          icon={List}
          title={t("landing.apps.list.title")}
          description={t("landing.apps.list.desc")}
          badge={openTasks || undefined}
          iconClassName="bg-sky-500/10 text-sky-600"
        />
      </TasksModuleSection>

      <TasksModuleSection
        title={t("landing.sections.planning")}
        description={t("landing.sections.planning_desc")}
        icon={Target}
        iconClassName="bg-violet-500/10 text-violet-600"
      >
        <TasksAppTile
          to="/tasks/sprints"
          icon={CalendarRange}
          title={t("landing.apps.sprints.title")}
          description={t("landing.apps.sprints.desc")}
          badge={activeSprints || undefined}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <TasksAppTile
          to="/tasks/new"
          icon={Plus}
          title={t("landing.apps.newTask.title")}
          description={t("landing.apps.newTask.desc")}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
      </TasksModuleSection>

      <TasksModuleSection
        title={t("landing.sections.insights")}
        description={t("landing.sections.insights_desc")}
        icon={LayoutDashboard}
        iconClassName="bg-amber-500/10 text-amber-600"
      >
        <TasksAppTile
          to="/tasks"
          icon={LayoutDashboard}
          title={t("landing.apps.dashboard.title")}
          description={t("landing.apps.dashboard.desc")}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
      </TasksModuleSection>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3">
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

      <p className="mt-6 text-center text-xs text-default-400">{t("landing.footer")}</p>
    </div>
  );
}
