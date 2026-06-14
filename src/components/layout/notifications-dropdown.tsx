import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Badge,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { Bell, Check, CircleAlert, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/features/notifications/hooks/use-notifications";
import type { AppNotification } from "@/features/notifications/types/notification.types";

function getLocalizedNotification(
  notification: AppNotification,
  t: (key: string, options?: any) => string
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
        const employeeName = match[1];
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, { employeeName }),
        };
      }
      break;
    }
    case "attendance_resumed": {
      const match = message.match(/^(.+) has resumed work\.?$/);
      if (match) {
        const employeeName = match[1];
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, { employeeName }),
        };
      }
      break;
    }
    case "attendance_completed": {
      const match = message.match(/^(.+) has checked out\.?(?: Total time: (.+?))?\.?$/);
      if (match) {
        const employeeName = match[1];
        const totalTime = match[2] || "N/A";
        return {
          title: t(`notifications.types.${type}.title`),
          message: t(`notifications.types.${type}.message`, { employeeName, totalTime }),
        };
      }
      break;
    }
  }

  return { title, message };
}

export function NotificationsDropdown() {
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      if (notification.link.startsWith("http")) {
        window.location.href = notification.link;
      } else {
        navigate(notification.link);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_created":
      case "task_updated":
        return <Briefcase className="w-4 h-4 text-primary" />;
      default:
        return <CircleAlert className="w-4 h-4 text-warning" />;
    }
  };

  const dateFnsLocale = i18n.language.startsWith("ar") ? ar : enUS;

  return (
    <Popover placement="bottom-end" isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          className="relative overflow-visible"
          aria-label={t("notifications.title")}
        >
          <Badge
            color="danger"
            content={unreadCount}
            isInvisible={unreadCount === 0}
            shape="circle"
          >
            <Bell className="w-5 h-5 text-default-600" />
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px] sm:w-[380px]">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between p-4 border-b border-default-100">
            <h3 className="font-semibold text-medium">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                startContent={<Check className="w-4 h-4" />}
                onPress={() => markAllAsRead.mutate()}
                isLoading={markAllAsRead.isPending}
              >
                {t("notifications.markAllAsRead")}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner size="sm" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-default-400 text-sm">
              {t("notifications.empty")}
            </div>
          ) : (
            <ScrollShadow className="max-h-[400px]">
              <div className="flex flex-col">
                {notifications.map((notification) => {
                  const localized = getLocalizedNotification(notification, t);
                  return (
                    <button
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 text-start transition-colors hover:bg-default-100 border-b border-default-100/50 last:border-none ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="mt-1 flex-shrink-0 bg-default-100 rounded-full p-2">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <p
                          className={`text-sm ${
                            !notification.isRead ? "font-semibold text-foreground" : "text-default-600"
                          }`}
                        >
                          {localized.title}
                        </p>
                        <p className="text-xs text-default-500 line-clamp-2">
                          {localized.message}
                        </p>
                        <p className="text-[10px] text-default-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: dateFnsLocale,
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollShadow>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
