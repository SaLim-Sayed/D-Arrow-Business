import type { CrmTaskStatus, CrmTaskType } from "../types/crm-tasks.types";

export const CRM_TASK_TYPES: CrmTaskType[] = [
  "call",
  "meeting",
  "email",
  "follow_up",
  "proposal",
];

export const CRM_TASK_STATUSES: CrmTaskStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

export function normalizeCrmTaskStatus(status: string): CrmTaskStatus {
  const map: Record<string, CrmTaskStatus> = {
    todo: "pending",
    done: "completed",
  };
  return (map[status] ?? status) as CrmTaskStatus;
}
