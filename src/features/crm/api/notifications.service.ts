import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type {
  CrmNotification,
  CreateNotificationDTO,
  UpdateNotificationDTO,
} from "../types/notifications.types";

const base = createCrmCollectionService<
  CrmNotification,
  CreateNotificationDTO,
  UpdateNotificationDTO
>(CRM_COLLECTIONS.notifications, "CrmNotificationsService", {
  read: false,
  type: "general",
});

export const CrmNotificationsService = {
  getNotifications: base.getAll,
  getNotificationById: base.getById,
  createNotification: base.create,
  updateNotification: base.update,
  deleteNotification: base.delete,
};
