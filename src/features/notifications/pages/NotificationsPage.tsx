import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Spinner,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Bell,
  Briefcase,
  Check,
  CircleAlert,
  FileCheck,
  MessageSquare,
  AtSign,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "../hooks/use-notifications";
import { getLocalizedNotification } from "../utils/localize-notification";
import type { AppNotification } from "../types/notification.types";

type FilterKey = "all" | "unread" | "read";

function dayGroup(date: Date, todayLabel: string, yesterdayLabel: string, earlierLabel: string) {
  if (isToday(date)) return todayLabel;
  if (isYesterday(date)) return yesterdayLabel;
  return earlierLabel;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "task_assigned":
    case "task_created":
    case "task_updated":
      return <Briefcase className="h-4 w-4 text-primary" />;
    case "chat_mention":
      return <AtSign className="h-4 w-4 text-secondary" />;
    case "chat_message":
      return <MessageSquare className="h-4 w-4 text-primary" />;
    case "document_approval":
      return <FileCheck className="h-4 w-4 text-warning" />;
    default:
      return <CircleAlert className="h-4 w-4 text-warning" />;
  }
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const dateFnsLocale = i18n.language.startsWith("ar") ? ar : enUS;
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (notifications ?? []).filter((notification) => {
      if (filter === "unread" && notification.isRead) return false;
      if (filter === "read" && !notification.isRead) return false;
      if (!needle) return true;
      const localized = getLocalizedNotification(notification, t);
      return (
        localized.title.toLowerCase().includes(needle) ||
        localized.message.toLowerCase().includes(needle)
      );
    });
  }, [notifications, filter, search, t]);

  const grouped = useMemo(() => {
    const groups = new Map<string, AppNotification[]>();
    for (const notification of filtered) {
      const created = new Date(notification.createdAt);
      const label = dayGroup(
        created,
        t("notifications.today"),
        t("notifications.yesterday"),
        t("notifications.earlier")
      );
      const list = groups.get(label) ?? [];
      list.push(notification);
      groups.set(label, list);
    }
    return groups;
  }, [filtered, t]);

  const openNotification = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (!notification.link) return;
    if (notification.link.startsWith("http")) {
      window.location.href = notification.link;
    } else {
      navigate(notification.link);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 rounded-3xl border border-default-200/70 bg-content1 p-4 shadow-sm sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-xl font-black tracking-tight text-foreground sm:text-2xl">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Bell size={24} />
            </div>
            {t("notifications.pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-default-500">{t("notifications.pageSubtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="flat"
            color="primary"
            startContent={<Check size={16} />}
            onPress={() => markAllAsRead.mutate()}
            isLoading={markAllAsRead.isPending}
            className="rounded-xl font-bold text-xs"
          >
            {t("notifications.markAllAsRead")}
          </Button>
        )}
      </div>

      <Card className="rounded-3xl border border-default-200/60 bg-background/60 shadow-sm backdrop-blur-xl">
        <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder={t("notifications.searchPlaceholder")}
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={16} className="text-default-400" />}
            variant="bordered"
            size="sm"
            className="min-w-0 flex-1"
            classNames={{ inputWrapper: "rounded-2xl" }}
          />
          <Tabs
            selectedKey={filter}
            onSelectionChange={(key) => setFilter(key as FilterKey)}
            size="sm"
            variant="solid"
            classNames={{ tabList: "rounded-2xl" }}
          >
            <Tab key="all" title={t("notifications.filterAll")} />
            <Tab
              key="unread"
              title={
                <span className="flex items-center gap-1.5">
                  {t("notifications.filterUnread")}
                  {unreadCount > 0 && (
                    <Chip size="sm" color="danger" variant="flat" className="h-5 min-w-5 px-1 text-[10px]">
                      {unreadCount}
                    </Chip>
                  )}
                </span>
              }
            />
            <Tab key="read" title={t("notifications.filterRead")} />
          </Tabs>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl border border-default-200/60 shadow-sm">
          <CardBody className="py-16 text-center text-sm text-default-400">
            {t("notifications.empty")}
          </CardBody>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([label, items]) => (
          <section key={label} className="space-y-2">
            <h2 className="px-1 text-xs font-black uppercase tracking-wider text-default-400">{label}</h2>
            <Card className="overflow-hidden rounded-3xl border border-default-200/60 shadow-sm">
              <CardBody className="p-0">
                {items.map((notification) => {
                  const localized = getLocalizedNotification(notification, t);
                  const created = new Date(notification.createdAt);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`flex w-full items-start gap-3 border-b border-default-100/60 p-4 text-start last:border-none hover:bg-default-100 ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 rounded-full bg-default-100 p-2">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${
                            !notification.isRead ? "font-semibold text-foreground" : "text-default-600"
                          }`}
                        >
                          {localized.title}
                        </p>
                        <p className="mt-0.5 text-xs text-default-500">{localized.message}</p>
                        <p className="mt-1 text-[10px] text-default-400">
                          {format(created, "PPp", { locale: dateFnsLocale })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </CardBody>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
