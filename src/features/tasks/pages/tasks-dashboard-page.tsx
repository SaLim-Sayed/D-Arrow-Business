import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { TaskStatsCards } from "../components/task-stats-cards";
import { TaskCharts } from "../components/task-chart";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@heroui/react";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";

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
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        actions={
          <Link 
            to="/tasks/new" 
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("list.newTask")}
          </Link>
        }
      />

      <TaskStatsCards tasks={tasks} />
      <TaskCharts tasks={tasks} />

      {/* Recent Tasks */}
      <Card className="bg-content1">
        <CardHeader className="flex flex-row items-center justify-between">
          <h4 className="text-base font-semibold">
            {t("dashboard.recentTasks")}
          </h4>
          <Link 
            to="/tasks/list"
            className="text-primary text-sm font-medium hover:underline"
          >
            {tc("actions.viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const initials = (task.assignee?.name ?? "")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-default-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-default-400">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.assignee && (
                    <Avatar size="sm">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  )}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
