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
  todo: "#3b82f6", /* Vibrant blue */
  in_progress: "#a855f7", /* Vibrant purple */
  in_review: "#f97316", /* Vibrant orange */
  done: "#22c55e", /* Vibrant green */
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#ec4899", /* Vibrant pink */
  medium: "#3b82f6", /* Vibrant blue */
  high: "#f97316", /* Vibrant orange */
  urgent: "#ef4444", /* Vibrant red */
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
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("dashboard.tasksByStatus")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fillOpacity={0.9}>
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t("dashboard.tasksByPriority")}
          </CardTitle>
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
                paddingAngle={2}
                fillOpacity={0.9}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {priorityData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2 text-xs font-medium">
                <div
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ 
                    backgroundColor: PRIORITY_COLORS[entry.key],
                    boxShadow: `0 0 8px ${PRIORITY_COLORS[entry.key]}40`
                  }}
                />
                <span className="text-slate-600 dark:text-slate-400">{entry.name}</span>
                <span className="font-semibold">({entry.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
