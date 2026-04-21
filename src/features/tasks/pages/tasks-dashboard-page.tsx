import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAllTasksQuery } from "../hooks/use-tasks";
import { TaskStatsCards } from "../components/task-stats-cards";
import { TaskCharts } from "../components/task-chart";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
          <Button asChild>
            <Link to="/tasks/new">
              <Plus className="h-4 w-4 me-1" />
              {t("list.newTask")}
            </Link>
          </Button>
        }
      />

      <TaskStatsCards tasks={tasks} />
      <TaskCharts tasks={tasks} />

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t("dashboard.recentTasks")}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tasks/list">{tc("actions.viewAll")}</Link>
          </Button>
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
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.assignee && (
                    <Avatar className="h-6 w-6 hidden sm:flex">
                      <AvatarFallback className="text-[10px]">
                        {initials}
                      </AvatarFallback>
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
