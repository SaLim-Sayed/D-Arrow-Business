import { useTranslation } from "react-i18next";
import { ListTodo, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Task } from "../types/task.types";
import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { useTasksWorkspaceNavigation } from "../hooks/use-tasks-workspace-navigation";

interface TaskStatsCardsProps {
  tasks: Task[];
}

export function TaskStatsCards({ tasks }: TaskStatsCardsProps) {
  const { t } = useTranslation("tasks");
  const { openAllTasks, openInProgress, openOverdue, openCompletedThisWeek } =
    useTasksWorkspaceNavigation();

  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
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
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      gradient: "from-blue-500/20 to-indigo-500/20",
      onPress: () => openAllTasks(),
    },
    {
      label: t("dashboard.inProgress"),
      value: inProgress,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      gradient: "from-amber-500/20 to-orange-500/20",
      onPress: () => openInProgress(),
    },
    {
      label: t("dashboard.overdue"),
      value: overdue,
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      gradient: "from-rose-500/20 to-red-500/20",
      onPress: () => openOverdue(),
    },
    {
      label: t("dashboard.completedThisWeek"),
      value: completedThisWeek,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      gradient: "from-emerald-500/20 to-teal-500/20",
      onPress: () => openCompletedThisWeek(),
    },
  ];

  return (
    <StatCardGrid>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </StatCardGrid>
  );
}
