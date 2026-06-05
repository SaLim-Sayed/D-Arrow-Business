import { z } from "zod";
import type { CreateCrmTaskDTO } from "../types/crm-tasks.types";

export const crmTaskFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  taskType: z.enum(["call", "meeting", "email", "follow_up", "proposal"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  description: z.string().optional(),
  entityType: z.enum(["lead", "contact", "deal", "crm_task"]).optional(),
  entityId: z.string().optional(),
});

export type CrmTaskFormValues = z.infer<typeof crmTaskFormSchema>;

export function toCreateCrmTaskDTO(values: CrmTaskFormValues): CreateCrmTaskDTO {
  return {
    title: values.title.trim(),
    description: values.description?.trim() ?? "",
    taskType: values.taskType,
    status: values.status ?? "pending",
    priority: values.priority ?? "medium",
    assigneeId: values.assigneeId ?? null,
    dueDate: values.dueDate ?? null,
    entityType: values.entityType ?? "lead",
    entityId: values.entityId ?? "",
    ownerId: values.assigneeId ?? null,
    tags: [],
  };
}
