import { useMemo, useState } from "react";
import { Button, Spinner, useDisclosure } from "@heroui/react";
import { BellRing, CalendarClock, CalendarDays, Plus, Sunrise } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { TasksMetricCards, TasksPageHeader, TasksPanel } from "@/features/tasks/components/tasks-ui";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { MeetingCard } from "../components/MeetingCard";
import { MeetingFormModal } from "../components/MeetingFormModal";
import { useDeleteMeetingMutation, useMeetingsQuery } from "../hooks/use-meetings";
import {
  browserNotificationPermission,
  requestBrowserNotifications,
} from "../hooks/use-meeting-reminders";
import { groupMeetings } from "../utils/meeting.utils";
import type { Meeting, MeetingStatus } from "../types/meeting.types";

const ACTIVE_STATUS: MeetingStatus = "scheduled";

export function MeetingsPage() {
  const { t } = useTranslation("meetings");
  const { data, isLoading } = useMeetingsQuery();
  const { data: users } = useAllUsers();
  const deleteMeeting = useDeleteMeetingMutation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [permission, setPermission] = useState(browserNotificationPermission());

  const meetings = useMemo(
    () => (data?.data ?? []).filter((m) => m.status === ACTIVE_STATUS),
    [data]
  );
  const groups = useMemo(() => groupMeetings(meetings), [meetings]);

  const handleNew = () => {
    setEditing(null);
    onOpen();
  };

  const handleEdit = (meeting: Meeting) => {
    setEditing(meeting);
    onOpen();
  };

  const handleDelete = (meeting: Meeting) => {
    deleteMeeting.mutate(meeting.id);
  };

  const handleEnableNotifications = async () => {
    const result = await requestBrowserNotifications();
    setPermission(result);
    if (result === "granted") toast.success(t("notifications.enabled"));
    else if (result === "denied") toast.error(t("notifications.denied"));
  };

  const sections = [
    { key: "today" as const, title: t("groups.today"), items: groups.today },
    { key: "tomorrow" as const, title: t("groups.tomorrow"), items: groups.tomorrow },
    { key: "upcoming" as const, title: t("groups.upcoming"), items: groups.upcoming },
    { key: "past" as const, title: t("groups.past"), items: groups.past },
  ];

  return (
    <div className="space-y-4">
      <TasksPageHeader
        title={t("title")}
        description={t("description")}
        action={
          <div className="flex flex-wrap gap-2">
            {permission === "default" && (
              <Button
                variant="flat"
                startContent={<BellRing className="h-4 w-4" />}
                onPress={handleEnableNotifications}
              >
                {t("notifications.enable")}
              </Button>
            )}
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleNew}
            >
              {t("newMeeting")}
            </Button>
          </div>
        }
      />

      <TasksMetricCards
        items={[
          {
            key: "today",
            label: t("groups.today"),
            value: groups.today.length,
            icon: CalendarClock,
            className: "bg-primary/10 text-primary",
          },
          {
            key: "tomorrow",
            label: t("groups.tomorrow"),
            value: groups.tomorrow.length,
            icon: Sunrise,
            className: "bg-warning/10 text-warning",
          },
          {
            key: "upcoming",
            label: t("groups.upcoming"),
            value: groups.upcoming.length,
            icon: CalendarDays,
            className: "bg-success/10 text-success",
          },
          {
            key: "past",
            label: t("groups.past"),
            value: groups.past.length,
            icon: CalendarDays,
            className: "bg-default-100 text-default-500",
          },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : meetings.length === 0 ? (
        <TasksPanel title={t("title")}>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CalendarClock className="h-8 w-8 text-default-300" />
            <p className="text-sm text-default-500">{t("empty")}</p>
            <Button
              color="primary"
              variant="flat"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleNew}
            >
              {t("newMeeting")}
            </Button>
          </div>
        </TasksPanel>
      ) : (
        <div className="space-y-4">
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <TasksPanel key={section.key} title={section.title}>
                <div className="space-y-2">
                  {section.items.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      users={users ?? []}
                      showDate={section.key !== "today"}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </TasksPanel>
            ))}
        </div>
      )}

      <MeetingFormModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        meeting={editing}
      />
    </div>
  );
}
