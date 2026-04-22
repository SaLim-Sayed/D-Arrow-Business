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
import { Card, CardBody, CardHeader } from "@heroui/react";
import type { Task } from "../types/task.types";

const STATUS_COLORS: Record<string, string> = {
  todo: "#94A3B8",
  in_progress: "#6366F1",
  in_review: "#A855F7",
  done: "#10B981",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#3B82F6",
  medium: "#6366F1",
  high: "#F59E0B",
  urgent: "#EF4444",
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
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in zoom-in duration-500 delay-200">
      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Overview</p>
          <h4 className="text-xl font-black">
            {t("dashboard.tasksByStatus")}
          </h4>
        </CardHeader>
        <CardBody className="px-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
              />
              <YAxis 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
              />
              <Tooltip 
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                contentStyle={{ 
                  backgroundColor: 'rgba(var(--heroui-content1), 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-1">Distribution</p>
          <h4 className="text-xl font-black">
            {t("dashboard.tasksByPriority")}
          </h4>
        </CardHeader>
        <CardBody className="px-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={8}
                stroke="none"
              >
                {priorityData.map((entry) => (
                  <Cell 
                    key={entry.key} 
                    fill={PRIORITY_COLORS[entry.key]} 
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(var(--heroui-content1), 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 px-4 pb-4">
            {priorityData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ 
                    backgroundColor: PRIORITY_COLORS[entry.key],
                    boxShadow: `0 0 10px ${PRIORITY_COLORS[entry.key]}60`
                  }}
                />
                <span className="text-default-500">{entry.name}</span>
                <span className="text-default-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
