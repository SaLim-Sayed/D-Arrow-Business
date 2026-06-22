import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { selectionKeyToString } from "@/lib/selection-key";
import type { TaskPriority, TaskStatus } from "../types/task.types";

export { selectionKeyToString } from "@/lib/selection-key";

export function normalizeTaskStatusValue(status: unknown): TaskStatus {
  const value = selectionKeyToString(status) ?? "";
  if ((TASK_STATUSES as readonly string[]).includes(value)) {
    return value as TaskStatus;
  }
  return "todo";
}

export function normalizeTaskPriorityValue(priority: unknown): TaskPriority {
  const value = selectionKeyToString(priority) ?? "";
  if ((TASK_PRIORITIES as readonly string[]).includes(value)) {
    return value as TaskPriority;
  }
  return "medium";
}
