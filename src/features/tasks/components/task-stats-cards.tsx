import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { ListTodo, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Task } from "../types/task.types";

interface TaskStatsCardsProps {
  tasks: Task[];
}

export function TaskStatsCards({ tasks }: TaskStatsCardsProps) {
  const { t } = useTranslation("tasks");

  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.completedAt &&
      new Date(t.completedAt) >= weekAgo,
  ).length;

  const stats = [
    {
      label: t("dashboard.totalTasks"),
      value: total,
      icon: ListTodo,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      gradient: "from-blue-500/20 to-indigo-500/20",
    },
    {
      label: t("dashboard.inProgress"),
      value: inProgress,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    {
      label: t("dashboard.overdue"),
      value: overdue,
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      gradient: "from-rose-500/20 to-red-500/20",
    },
    {
      label: t("dashboard.completedThisWeek"),
      value: completedThisWeek,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
  ];

  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-card border-none overflow-hidden relative group">
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <p className="text-[10px] font-black text-default-400 uppercase tracking-[0.15em]">{stat.label}</p>
            <div className={`rounded-2xl p-3 ${stat.bg} shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardBody className="py-4 relative z-10">
            <div className="text-4xl font-black tracking-tight">{stat.value}</div>
            <div className="mt-2 h-1 w-12 rounded-full bg-default-200 group-hover:w-full transition-all duration-500" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
