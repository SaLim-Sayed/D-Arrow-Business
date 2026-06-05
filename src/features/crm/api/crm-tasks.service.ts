import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { CrmTask, CreateCrmTaskDTO, UpdateCrmTaskDTO } from "../types/crm-tasks.types";

const base = createCrmCollectionService<CrmTask, CreateCrmTaskDTO, UpdateCrmTaskDTO>(
  CRM_COLLECTIONS.crmTasks,
  "CrmTasksService",
  {
    status: "pending",
    priority: "medium",
    taskType: "follow_up",
    ownerId: null,
    assigneeId: null,
    tags: [],
    entityType: "lead",
    entityId: "",
    title: "",
  }
);

export const CrmTasksService = {
  getCrmTasks: base.getAll,
  getCrmTaskById: base.getById,
  createCrmTask: base.create,
  updateCrmTask: base.update,
  deleteCrmTask: base.delete,
};
