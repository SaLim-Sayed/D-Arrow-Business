import type { CrmBaseFields, CrmEntityType } from "./crm.common.types";

export type CrmTaskType = "call" | "meeting" | "email" | "follow_up" | "proposal";
export type CrmTaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type CrmTaskPriority = "low" | "medium" | "high";

export interface CrmTask extends CrmBaseFields {
  title: string;
  description?: string;
  taskType: CrmTaskType;
  status: CrmTaskStatus;
  priority: CrmTaskPriority;
  dueDate?: string | null;
  entityType: CrmEntityType;
  entityId: string;
  assigneeId: string | null;
}

export type CreateCrmTaskDTO = Omit<CrmTask, "id" | "createdAt" | "updatedAt">;
export type UpdateCrmTaskDTO = Partial<CreateCrmTaskDTO>;

export interface CrmTaskFilters {
  status?: CrmTaskStatus[];
  assigneeId?: string;
  entityType?: CrmEntityType;
  entityId?: string;
  taskType?: CrmTaskType;
}
