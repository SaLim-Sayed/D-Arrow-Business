import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { TaskStatsCards } from "../components/task-stats-cards";
import { TaskCharts } from "../components/task-chart";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Card, CardHeader, CardBody, Avatar } from "@heroui/react";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

export function TasksDashboardPage() {
  const { t } = useTranslation("tasks");
  const { t: tc } = useTranslation();
  const { data, isLoading } = useAllTasksQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const tasks = data?.data ?? [];
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-70">
          {tc("nav.dashboard")}
        </h2>
        <PageHeader
          title={t("dashboard.title")}
          description={t("dashboard.subtitle")}
          actions={
            <Link 
              to="/tasks/new" 
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-xl shadow-primary/40 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all gap-2"
            >
              <Plus className="h-4 w-4 stroke-[4px]" />
              {t("list.newTask")}
            </Link>
          }
        />
      </div>

      <TaskStatsCards tasks={tasks} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <TaskCharts tasks={tasks} />
        </div>

        {/* Recent Tasks */}
        <Card className="glass-card border-none h-full">
          <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
            <h4 className="text-lg font-bold">
              {t("dashboard.recentTasks")}
            </h4>
            <Link 
              to="/tasks/list"
              className="text-primary text-xs font-bold uppercase tracking-wider hover:underline"
            >
              {tc("actions.viewAll")}
            </Link>
          </CardHeader>
          <CardBody className="px-4 pb-6">
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const initials = (task.assignee?.name ?? "")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="flex items-center gap-4 rounded-2xl p-3 hover:bg-default-100/50 hover:scale-[1.02] transition-all group"
                  >
                    <div className="relative">
                      {task.assignee ? (
                        <Avatar 
                          size="sm" 
                          src={task.assignee.avatar} 
                          fallback={initials} 
                          showFallback 
                          className="ring-2 ring-background group-hover:ring-primary/30 transition-all"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-default-100 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-default-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      <p className="text-[10px] font-medium text-default-400 uppercase tracking-tighter">
                        {formatDate(task.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={task.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
