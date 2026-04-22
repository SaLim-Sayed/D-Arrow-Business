import { Chip, ChipLabel } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { TaskStatus } from "@/features/tasks/types/task.types";

const statusConfig: Record<
  TaskStatus,
  { color: "default" | "success" | "danger" | "accent" | "warning" }
> = {
  todo: { color: "default" },
  in_progress: { color: "warning" },
  in_review: { color: "accent" },
  done: { color: "success" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation("tasks");
  const config = statusConfig[status];

  return (
    <Chip 
      size="sm" 
      variant="soft" 
      color={config.color}
      className="font-medium"
    >
      <ChipLabel>{t(`status.${status}`)}</ChipLabel>
    </Chip>
  );
}
