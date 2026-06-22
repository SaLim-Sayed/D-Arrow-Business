import { Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { TaskPriority } from "@/features/tasks/types/task.types";
import { normalizeTaskPriorityValue } from "@/features/tasks/utils/task-field-normalizers";

const priorityConfig: Record<
  TaskPriority,
  { color: "default" | "secondary" | "warning" | "danger" | "success" }
> = {
  low: { color: "default" },
  medium: { color: "secondary" },
  high: { color: "warning" },
  urgent: { color: "danger" },
};

export function PriorityBadge({
  priority,
}: {
  priority: string | undefined | null;
}) {
  const { t } = useTranslation("tasks");
  const normalized = normalizeTaskPriorityValue(priority);
  const config = priorityConfig[normalized];

  return (
    <Chip size="sm" variant="flat" color={config.color} className="font-medium">
      {t(`priority.${normalized}`)}
    </Chip>
  );
}
