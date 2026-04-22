import { Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { TaskPriority } from "@/features/tasks/types/task.types";

const priorityConfig: Record<
  TaskPriority,
  { color: "default" | "secondary" | "warning" | "danger" | "success" }
> = {
  low: { color: "default" },
  medium: { color: "secondary" },
  high: { color: "warning" },
  urgent: { color: "danger" },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation("tasks");
  const config = priorityConfig[priority];

  return (
    <Chip size="sm" variant="flat" color={config.color} className="font-medium">
      {t(`priority.${priority}`)}
    </Chip>
  );
}
