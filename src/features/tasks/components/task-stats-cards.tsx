import { useTranslation } from "react-i18next";
import { ListTodo, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Task } from "../types/task.types";
import { TasksMetricCards } from "./tasks-ui";
import { useTasksWorkspaceNavigation } from "../hooks/use-tasks-workspace-navigation";

interface TaskStatsCardsProps {
  tasks: Task[];
}

export function TaskStatsCards({ tasks }: TaskStatsCardsProps) {
  const { t } = useTranslation("tasks");
  const { openAllTasks, openInProgress, openOverdue, openCompletedThisWeek } =
    useTasksWorkspaceNavigation();

  const total = tasks.length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const overdue = tasks.filter(
    (task) =>
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(
    (task) =>
      task.status === "done" &&
      task.completedAt &&
      new Date(task.completedAt) >= weekAgo
  ).length;

  return (
    <TasksMetricCards
      items={[
        {
          key: "total",
          label: t("dashboard.totalTasks"),
          value: total,
          icon: ListTodo,
          className: "text-primary bg-primary/10",
          onPress: () => openAllTasks(),
        },
        {
          key: "in_progress",
          label: t("dashboard.inProgress"),
          value: inProgress,
          icon: Clock,
          className: "text-warning-700 bg-warning/10 dark:text-warning",
          onPress: () => openInProgress(),
        },
        {
          key: "overdue",
          label: t("dashboard.overdue"),
          value: overdue,
          icon: AlertTriangle,
          className: "text-danger bg-danger/10",
          onPress: () => openOverdue(),
        },
        {
          key: "completed",
          label: t("dashboard.completedThisWeek"),
          value: completedThisWeek,
          icon: CheckCircle,
          className: "text-success bg-success/10",
          onPress: () => openCompletedThisWeek(),
        },
      ]}
    />
  );
}
