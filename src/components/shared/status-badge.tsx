import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { TaskStatus } from "@/features/tasks/types/task.types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  TaskStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  todo: { variant: "secondary", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  in_progress: { variant: "default", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  in_review: { variant: "default", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  done: { variant: "default", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation("tasks");
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("font-medium", config.className)}>
      {t(`status.${status}`)}
    </Badge>
  );
}
