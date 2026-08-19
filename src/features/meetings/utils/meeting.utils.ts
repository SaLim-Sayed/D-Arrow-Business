import type { Meeting } from "../types/meeting.types";

/** Moment the reminder for a meeting is due. */
export function meetingReminderAt(meeting: Meeting): Date {
  const start = new Date(meeting.startAt).getTime();
  return new Date(start - (meeting.reminderMinutesBefore || 0) * 60_000);
}

export function meetingEndsAt(meeting: Meeting): Date {
  const start = new Date(meeting.startAt).getTime();
  return new Date(start + (meeting.durationMinutes || 30) * 60_000);
}

export function isMeetingParticipant(meeting: Meeting, userId: string): boolean {
  return meeting.organizerId === userId || meeting.attendeeIds.includes(userId);
}

/**
 * A reminder is due when its time has passed but the meeting has not been over
 * for more than an hour — opening the app days later must not replay old
 * reminders.
 */
export function isReminderDue(
  meeting: Meeting,
  userId: string,
  now = new Date()
): boolean {
  if (meeting.status !== "scheduled") return false;
  if (!isMeetingParticipant(meeting, userId)) return false;
  if (meeting.remindedUserIds?.includes(userId)) return false;
  if (now < meetingReminderAt(meeting)) return false;
  return now.getTime() <= meetingEndsAt(meeting).getTime() + 60 * 60_000;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type MeetingBucket = "today" | "tomorrow" | "upcoming" | "past";

export function meetingBucket(meeting: Meeting, now = new Date()): MeetingBucket {
  if (meetingEndsAt(meeting) < now) return "past";
  const today = startOfDay(now);
  const start = startOfDay(new Date(meeting.startAt));
  const diffDays = Math.round(
    (start.getTime() - today.getTime()) / (24 * 60 * 60_000)
  );
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return "upcoming";
}

export function groupMeetings(
  meetings: Meeting[],
  now = new Date()
): Record<MeetingBucket, Meeting[]> {
  const groups: Record<MeetingBucket, Meeting[]> = {
    today: [],
    tomorrow: [],
    upcoming: [],
    past: [],
  };
  for (const meeting of meetings) {
    groups[meetingBucket(meeting, now)].push(meeting);
  }
  const byStart = (a: Meeting, b: Meeting) => a.startAt.localeCompare(b.startAt);
  groups.today.sort(byStart);
  groups.tomorrow.sort(byStart);
  groups.upcoming.sort(byStart);
  groups.past.sort((a, b) => b.startAt.localeCompare(a.startAt));
  return groups;
}

/** "2026-08-15" + "15:00" → local ISO string */
export function toMeetingStartIso(dateIso: string, time: string): string {
  const [hours, minutes] = time.split(":").map((part) => Number(part) || 0);
  const date = new Date(`${dateIso}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function meetingDatePart(startAt: string): string {
  const date = new Date(startAt);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function meetingTimePart(startAt: string): string {
  const date = new Date(startAt);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatMeetingTime(startAt: string, locale: string): string {
  return new Date(startAt).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMeetingDate(startAt: string, locale: string): string {
  return new Date(startAt).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
