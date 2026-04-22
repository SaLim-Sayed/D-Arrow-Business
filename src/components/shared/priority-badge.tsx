import { Chip, ChipLabel } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { TaskPriority } from "@/features/tasks/types/task.types";

const priorityConfig: Record<
  TaskPriority,
  { color: "default" | "accent" | "warning" | "danger" | "success" }
> = {
  low: { color: "default" },
  medium: { color: "accent" },
  high: { color: "warning" },
  urgent: { color: "danger" },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { t } = useTranslation("tasks");
  const config = priorityConfig[priority];

  return (
    <Chip 
      size="sm" 
      variant="soft" 
      color={config.color}
      className="font-medium"
    >
      <ChipLabel>{t(`priority.${priority}`)}</ChipLabel>
    </Chip>
  );
}
