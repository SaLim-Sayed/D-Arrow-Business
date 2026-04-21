import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { TaskPriority } from "@/features/tasks/types/task.types";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  TaskPriority,
  { className: string }
> = {
  low: { className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  medium: { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  high: { className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  urgent: { className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation("tasks");
  const config = priorityConfig[priority];

  return (
    <Badge variant="secondary" className={cn("font-medium", config.className)}>
      {t(`priority.${priority}`)}
    </Badge>
  );
}
