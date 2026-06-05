import type { CrmEntityType } from "./crm.common.types";

export type CrmNotificationType =
  | "assignment"
  | "deal_stage"
  | "lead_assigned"
  | "reminder"
  | "general";

export interface CrmNotification {
  id: string;
  userId: string;
  type: CrmNotificationType;
  title: string;
  body: string;
  entityType?: CrmEntityType;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

export type CreateNotificationDTO = Omit<CrmNotification, "id" | "createdAt" | "read"> & {
  read?: boolean;
};

export type UpdateNotificationDTO = Partial<Pick<CrmNotification, "read">>;

export interface NotificationFilters {
  userId?: string;
  read?: boolean;
}
