import type { CrmEntityType } from "./crm.common.types";

export type ActivityType = "call" | "email" | "meeting" | "note" | "other";

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  entityType: CrmEntityType;
  entityId: string;
  occurredAt: string;
  durationMinutes?: number;
  userId: string;
  createdAt: string;
}

export type CreateActivityDTO = Omit<Activity, "id" | "createdAt">;
export type UpdateActivityDTO = Partial<CreateActivityDTO>;

export interface ActivityFilters {
  entityType?: CrmEntityType;
  entityId?: string;
  userId?: string;
}
