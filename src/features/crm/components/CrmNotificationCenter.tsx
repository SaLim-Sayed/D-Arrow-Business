import {
  Badge,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  useCrmNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUnreadNotificationCount,
} from "../hooks/use-crm-notifications";
import { formatDate } from "@/lib/utils";

export function CrmNotificationCenter() {
  const { t } = useTranslation("crm");
  const { data: notifications = [] } = useCrmNotificationsQuery();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const entityLink = (entityType?: string, entityId?: string) => {
    if (!entityType || !entityId) return null;
    if (entityType === "lead") return `/crm/leads/${entityId}`;
    if (entityType === "contact") return `/crm/contacts/${entityId}`;
    if (entityType === "deal") return `/crm/deals/${entityId}`;
    return null;
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button isIconOnly variant="light" className="relative rounded-full" aria-label={t("notifications.title")}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge
              content={unread > 9 ? "9+" : unread}
              color="danger"
              size="sm"
              className="absolute -top-1 -right-1"
            >
              <span />
            </Badge>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={t("notifications.title")} className="max-w-sm">
        <DropdownSection title={t("notifications.title")} showDivider>
          {notifications.length === 0 ? (
            <DropdownItem key="empty" isReadOnly>
              {t("notifications.empty")}
            </DropdownItem>
          ) : (
            notifications.slice(0, 10).map((n) => {
              const link = entityLink(n.entityType, n.entityId);
              return (
                <DropdownItem
                  key={n.id}
                  description={formatDate(n.createdAt)}
                  className={n.read ? "opacity-60" : "font-semibold"}
                  onPress={() => {
                    if (!n.read) markRead.mutate(n.id);
                  }}
                >
                  {link ? (
                    <Link to={link} className="block" onClick={() => !n.read && markRead.mutate(n.id)}>
                      <span className="block text-sm">{n.title}</span>
                      <span className="block text-xs text-default-500 font-normal">{n.body}</span>
                    </Link>
                  ) : (
                    <>
                      <span className="block text-sm">{n.title}</span>
                      <span className="block text-xs text-default-500 font-normal">{n.body}</span>
                    </>
                  )}
                </DropdownItem>
              );
            })
          )}
        </DropdownSection>
        {notifications.some((n) => !n.read) ? (
          <DropdownSection>
            <DropdownItem key="mark-all" onPress={() => markAllRead.mutate(notifications)}>
              {t("notifications.markAllRead")}
            </DropdownItem>
          </DropdownSection>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  );
}
