export type NotificationType = "task_created" | "task_updated" | "task_assigned" | "general";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}
