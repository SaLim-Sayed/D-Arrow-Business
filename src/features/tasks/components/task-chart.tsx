import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "../types/task.types";

const STATUS_COLORS: Record<string, string> = {
  todo: "#a1a1aa",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#22c55e",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#a1a1aa",
  medium: "#3b82f6",
  high: "#f97316",
  urgent: "#ef4444",
};

export function TaskCharts({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation("tasks");

  const statusData = [
    { name: t("status.todo"), value: tasks.filter((t) => t.status === "todo").length, key: "todo" },
    { name: t("status.in_progress"), value: tasks.filter((t) => t.status === "in_progress").length, key: "in_progress" },
    { name: t("status.in_review"), value: tasks.filter((t) => t.status === "in_review").length, key: "in_review" },
    { name: t("status.done"), value: tasks.filter((t) => t.status === "done").length, key: "done" },
  ];

  const priorityData = [
    { name: t("priority.low"), value: tasks.filter((t) => t.priority === "low").length, key: "low" },
    { name: t("priority.medium"), value: tasks.filter((t) => t.priority === "medium").length, key: "medium" },
    { name: t("priority.high"), value: tasks.filter((t) => t.priority === "high").length, key: "high" },
    { name: t("priority.urgent"), value: tasks.filter((t) => t.priority === "urgent").length, key: "urgent" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.tasksByStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.tasksByPriority")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {priorityData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[entry.key] }}
                />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
