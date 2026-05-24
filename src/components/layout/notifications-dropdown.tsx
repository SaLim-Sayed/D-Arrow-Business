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
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/features/notifications/hooks/use-notifications";
import type { AppNotification } from "@/features/notifications/types/notification.types";

export function NotificationsDropdown() {
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
      // e.g. navigate to "/tasks/123" if the link is "/tasks/123"
      // or we can do window.location.href if it's a full URL
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

  return (
    <Popover placement="bottom-end" isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          className="relative overflow-visible"
          aria-label="Notifications"
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
            <h3 className="font-semibold text-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="light"
                color="primary"
                startContent={<Check className="w-4 h-4" />}
                onPress={() => markAllAsRead.mutate()}
                isLoading={markAllAsRead.isPending}
              >
                Mark all as read
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner size="sm" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-default-400 text-sm">
              No notifications yet.
            </div>
          ) : (
            <ScrollShadow className="max-h-[400px]">
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-default-100 border-b border-default-100/50 last:border-none ${
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
                        {notification.title}
                      </p>
                      <p className="text-xs text-default-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-default-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollShadow>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
