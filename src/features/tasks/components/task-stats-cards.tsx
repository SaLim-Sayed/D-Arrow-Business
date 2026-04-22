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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      label: t("dashboard.inProgress"),
      value: inProgress,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      label: t("dashboard.overdue"),
      value: overdue,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
      border: "border-red-200 dark:border-red-800",
    },
    {
      label: t("dashboard.completedThisWeek"),
      value: completedThisWeek,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      border: "border-green-200 dark:border-green-800",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={`border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 ${stat.border}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className={`rounded-lg p-2.5 ${stat.bg} shadow-sm`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
