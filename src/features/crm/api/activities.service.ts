import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { Activity, CreateActivityDTO, UpdateActivityDTO } from "../types/activities.types";

const base = createCrmCollectionService<Activity, CreateActivityDTO, UpdateActivityDTO>(
  CRM_COLLECTIONS.activities,
  "ActivitiesService",
  {
    type: "note",
    entityType: "lead",
    entityId: "",
    subject: "",
    userId: "",
  }
);

export const ActivitiesService = {
  getActivities: base.getAll,
  getActivityById: base.getById,
  createActivity: base.create,
  updateActivity: base.update,
  deleteActivity: base.delete,
};
