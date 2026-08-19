export type MeetingStatus = "scheduled" | "cancelled";

export interface Meeting {
  id: string;
  title: string;
  /** Free-text team/group, e.g. "فريق البرمجة" */
  team: string;
  agenda: string;
  /** ISO string — meeting start */
  startAt: string;
  durationMinutes: number;
  /** Room name or meeting link */
  location: string;
  organizerId: string | null;
  attendeeIds: string[];
  /** 0 = remind exactly at the meeting time */
  reminderMinutesBefore: number;
  /** Users already reminded — keeps the reminder from firing twice per user */
  remindedUserIds: string[];
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateMeetingDTO = Omit<Meeting, "id" | "createdAt" | "updatedAt">;
export type UpdateMeetingDTO = Partial<CreateMeetingDTO>;

export const MEETING_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
export const MEETING_REMINDER_OPTIONS = [0, 5, 15, 30, 60] as const;
