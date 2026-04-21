import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Task } from "../types/task.types";

interface TaskStatsCardsProps {
  tasks: Task[];
}

export function TaskStatsCards({ tasks }: TaskStatsCardsProps) {
  const { t } = useTranslation("tasks");

  const total = tasks.length;
  const inProgress = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const overdue = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== "done"
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.completedAt &&
      new Date(t.completedAt) >= weekAgo
  ).length;

  const stats = [
    {
      label: t("dashboard.totalTasks"),
      value: total,
      icon: ListTodo,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: t("dashboard.inProgress"),
      value: inProgress,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: t("dashboard.overdue"),
      value: overdue,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: t("dashboard.completedThisWeek"),
      value: completedThisWeek,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className={`rounded-md p-2 ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
