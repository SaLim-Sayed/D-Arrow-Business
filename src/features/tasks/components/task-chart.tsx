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
  Legend,
} from "recharts";
import type { Task, TaskPriority, TaskStatus } from "../types/task.types";
import { useTasksWorkspaceNavigation } from "../hooks/use-tasks-workspace-navigation";
import { TasksPanel } from "./tasks-ui";

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
  const { openByStatus, openByPriority } = useTasksWorkspaceNavigation();

  const statusData = [
    {
      name: t("status.todo"),
      value: tasks.filter((task) => task.status === "todo").length,
      key: "todo" as TaskStatus,
    },
    {
      name: t("status.in_progress"),
      value: tasks.filter((task) => task.status === "in_progress").length,
      key: "in_progress" as TaskStatus,
    },
    {
      name: t("status.in_review"),
      value: tasks.filter((task) => task.status === "in_review").length,
      key: "in_review" as TaskStatus,
    },
    {
      name: t("status.done"),
      value: tasks.filter((task) => task.status === "done").length,
      key: "done" as TaskStatus,
    },
  ];

  const priorityData = [
    {
      name: t("priority.low"),
      value: tasks.filter((task) => task.priority === "low").length,
      key: "low" as TaskPriority,
    },
    {
      name: t("priority.medium"),
      value: tasks.filter((task) => task.priority === "medium").length,
      key: "medium" as TaskPriority,
    },
    {
      name: t("priority.high"),
      value: tasks.filter((task) => task.priority === "high").length,
      key: "high" as TaskPriority,
    },
    {
      name: t("priority.urgent"),
      value: tasks.filter((task) => task.priority === "urgent").length,
      key: "urgent" as TaskPriority,
    },
  ].filter((entry) => entry.value > 0);

  const handleStatusClick = (key: TaskStatus) => {
    if (tasks.some((task) => task.status === key)) {
      openByStatus(key);
    }
  };

  const handlePriorityClick = (key: TaskPriority) => {
    if (tasks.some((task) => task.priority === key)) {
      openByPriority(key);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TasksPanel title={t("dashboard.tasksByStatus")}>
        <div className="min-h-[240px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a" }}
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: "#71717a" }}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--heroui-default-200)",
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                barSize={24}
                cursor="pointer"
                onClick={(data) => {
                  const key = (data as { payload?: { key?: TaskStatus } }).payload
                    ?.key;
                  if (key) handleStatusClick(key);
                }}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TasksPanel>

      <TasksPanel title={t("dashboard.tasksByPriority")}>
        {priorityData.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-12 text-sm text-default-400">
            {t("dashboard.noData")}
          </p>
        ) : (
          <div className="min-h-[240px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={4}
                  stroke="none"
                  cursor="pointer"
                  onClick={(_, index) => {
                    const entry = priorityData[index];
                    if (entry) handlePriorityClick(entry.key);
                  }}
                >
                  {priorityData.map((entry) => (
                    <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </TasksPanel>
    </div>
  );
}
