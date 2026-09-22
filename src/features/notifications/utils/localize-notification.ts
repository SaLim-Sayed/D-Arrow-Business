import type { AppNotification } from "../types/notification.types";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function getLocalizedNotification(
  notification: AppNotification,
  t: Translate
): { title: string; message: string } {
  const { type, title, message } = notification;

  if (!type) {
    return { title, message };
  }

  switch (type) {
    case "task_created":
    case "task_updated":
    case "task_assigned": {
      const match = message.match(/^The task "(.+)" was (?:created|updated|assigned) by (.+?)\.?$/);
      if (match) {
        const taskTitle = match[1];
        const actionBy = match[2];
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, { taskTitle, actionBy }),
        };
      }
      break;
    }
    case "attendance_started": {
      const match = message.match(/^(.+) has started work\.?$/);
      if (match) {
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, { employeeName: match[1] }),
        };
      }
      break;
    }
    case "attendance_resumed": {
      const match = message.match(/^(.+) has resumed work\.?$/);
      if (match) {
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, { employeeName: match[1] }),
        };
      }
      break;
    }
    case "attendance_completed": {
      const match = message.match(/^(.+) has checked out\.?(?: Total time: (.+?))?\.?$/);
      if (match) {
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, {
            employeeName: match[1],
            totalTime: match[2] || "N/A",
          }),
        };
      }
      break;
    }
    case "chat_mention": {
      const looksStoredPhrase = /mentioned|أشار/i.test(title);
      if (looksStoredPhrase) return { title, message };
      return {
        title: t("notifications.types.chat_mention.title", { name: title }),
        message,
      };
    }
    case "chat_message":
      return {
        title: t("notifications.types.chat_message.title", { name: title }),
        message,
      };
    case "document_approval":
      return {
        title: t("notifications.types.document_approval.title"),
        message: t("notifications.types.document_approval.message", {
          name: title,
          message,
        }),
      };
  }

  return { title, message };
}
