import { z } from "zod";
import type { CreateMeetingDTO } from "../types/meeting.types";
import { toMeetingStartIso } from "../utils/meeting.utils";

export const meetingFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  team: z.string().max(60).optional(),
  dateIso: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  durationMinutes: z.number().int().min(5).max(480),
  location: z.string().max(300).optional(),
  agenda: z.string().max(2000).optional(),
  attendeeIds: z.array(z.string()),
  reminderMinutesBefore: z.number().int().min(0).max(1440),
});

export type MeetingFormValues = z.infer<typeof meetingFormSchema>;

export function toCreateMeetingDTO(
  values: MeetingFormValues,
  organizerId: string | null
): CreateMeetingDTO {
  return {
    title: values.title.trim(),
    team: values.team?.trim() ?? "",
    agenda: values.agenda?.trim() ?? "",
    startAt: toMeetingStartIso(values.dateIso, values.time),
    durationMinutes: values.durationMinutes,
    location: values.location?.trim() ?? "",
    organizerId,
    attendeeIds: values.attendeeIds,
    reminderMinutesBefore: values.reminderMinutesBefore,
    remindedUserIds: [],
    status: "scheduled",
  };
}
