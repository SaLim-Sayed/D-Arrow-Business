import { Avatar, AvatarGroup, Button, Chip, Tooltip } from "@heroui/react";
import { Clock, MapPin, Users, Pencil, Trash2, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { User } from "@/features/auth/types/auth.types";
import type { Meeting } from "../types/meeting.types";
import {
  formatMeetingDate,
  formatMeetingTime,
  meetingEndsAt,
} from "../utils/meeting.utils";

interface MeetingCardProps {
  meeting: Meeting;
  users: User[];
  showDate?: boolean;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
}

export function MeetingCard({
  meeting,
  users,
  showDate = false,
  onEdit,
  onDelete,
}: MeetingCardProps) {
  const { t, i18n } = useTranslation("meetings");
  const attendees = meeting.attendeeIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => !!u);
  const isPast = meetingEndsAt(meeting) < new Date();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-default-200 bg-content1 p-3 sm:flex-row sm:items-start sm:justify-between",
        isPast && "opacity-70"
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="flat" color="primary" className="tabular-nums">
            {formatMeetingTime(meeting.startAt, i18n.language)}
          </Chip>
          <h3 className="truncate text-sm font-bold text-default-900">
            {meeting.title}
          </h3>
          {meeting.team && (
            <Chip size="sm" variant="flat" color="secondary">
              {meeting.team}
            </Chip>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-default-500">
          {showDate && (
            <span className="flex items-center gap-1">
              {formatMeetingDate(meeting.startAt, i18n.language)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {t("form.minutes", { count: meeting.durationMinutes })}
          </span>
          <span className="flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" />
            {meeting.reminderMinutesBefore === 0
              ? t("form.reminderAtTime")
              : t("form.reminderBefore", {
                  count: meeting.reminderMinutesBefore,
                })}
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{meeting.location}</span>
            </span>
          )}
        </div>

        {meeting.agenda && (
          <p className="whitespace-pre-wrap text-xs text-default-600">
            {meeting.agenda}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {attendees.length > 0 ? (
          <AvatarGroup max={4} size="sm" isBordered>
            {attendees.map((user) => (
              <Tooltip key={user.id} content={user.name}>
                <Avatar size="sm" name={user.name} src={user.avatar || undefined} />
              </Tooltip>
            ))}
          </AvatarGroup>
        ) : (
          <span className="flex items-center gap-1 text-xs text-default-400">
            <Users className="h-3.5 w-3.5" />
            {t("card.noAttendees")}
          </span>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label={t("card.edit")}
          onPress={() => onEdit(meeting)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          aria-label={t("card.delete")}
          onPress={() => onDelete(meeting)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
