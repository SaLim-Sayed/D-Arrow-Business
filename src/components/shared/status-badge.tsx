import { Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import type { TaskStatus } from "@/features/tasks/types/task.types";
import { normalizeTaskStatusValue } from "@/features/tasks/utils/task-field-normalizers";

const statusConfig: Record<
  TaskStatus,
  { color: "default" | "success" | "danger" | "secondary" | "warning" }
> = {
  todo: { color: "default" },
  in_progress: { color: "warning" },
  in_review: { color: "secondary" },
  done: { color: "success" },
};

export function StatusBadge({ status }: { status: string | undefined | null }) {
  const { t } = useTranslation("tasks");
  const normalized = normalizeTaskStatusValue(status);
  const config = statusConfig[normalized];

  return (
    <Chip
      size="sm"
      variant="flat"
      color={config.color}
      className="font-medium"
    >
      {t(`status.${normalized}`)}
    </Chip>
  );
}
