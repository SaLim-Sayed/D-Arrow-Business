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

export function formatMeetingTimeRange(
  meeting: Meeting,
  locale: string
): string {
  const start = formatMeetingTime(meeting.startAt, locale);
  const end = meetingEndsAt(meeting).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${start} – ${end}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Six Sunday-first weeks covering the given month. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

export function meetingsOnDay(meetings: Meeting[], day: Date): Meeting[] {
  return meetings
    .filter((meeting) => isSameDay(new Date(meeting.startAt), day))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

/** Google Calendar-like event colors, picked deterministically per meeting. */
const MEETING_COLORS = [
  "#1a73e8",
  "#33b679",
  "#f4511e",
  "#8e24aa",
  "#e67c73",
  "#f6bf26",
  "#039be5",
];

export function meetingColor(meeting: Meeting): string {
  const seed = meeting.team || meeting.title || meeting.id;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  return MEETING_COLORS[hash % MEETING_COLORS.length];
}
