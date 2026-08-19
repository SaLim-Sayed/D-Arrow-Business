import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { NotificationsService } from "@/features/notifications/api/notifications.service";
import { MeetingsService } from "../api/meetings.service";
import { useMeetingsQuery } from "./use-meetings";
import { isReminderDue, formatMeetingTime } from "../utils/meeting.utils";
import type { Meeting } from "../types/meeting.types";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Fires meeting reminders for the signed-in user while the app is open.
 *
 * There is no server-side scheduler in this project, so every client checks its
 * own meetings on a timer. `remindedUserIds` is written to Firestore before the
 * notification is created, which keeps a second tab or device from sending the
 * same reminder twice.
 */
export function useMeetingReminders() {
  const { t, i18n } = useTranslation("meetings");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const { data } = useMeetingsQuery();
  const meetings = data?.data;

  const meetingsRef = useRef<Meeting[]>([]);
  const inFlightRef = useRef<Set<string>>(new Set());

  // The timer reads the latest meetings without being torn down on every fetch.
  useEffect(() => {
    meetingsRef.current = meetings ?? [];
  }, [meetings]);

  useEffect(() => {
    if (!companyId || !userId) return;

    const fire = async (meeting: Meeting) => {
      if (inFlightRef.current.has(meeting.id)) return;
      inFlightRef.current.add(meeting.id);
      try {
        await MeetingsService.markReminded(companyId, meeting.id, userId);
        const time = formatMeetingTime(meeting.startAt, i18n.language);
        const title = t("reminder.title");
        const message = meeting.team
          ? t("reminder.bodyWithTeam", {
              title: meeting.title,
              team: meeting.team,
              time,
            })
          : t("reminder.body", { title: meeting.title, time });

        // The global notifications subscription turns this into the toast and
        // the browser alert, so the reminder is delivered like any other alert.
        await NotificationsService.createNotification(companyId, {
          userId,
          title,
          message,
          type: "general",
          link: "/meetings",
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings.all });
      } catch {
        // Retry on the next tick (e.g. offline while the reminder came due).
        inFlightRef.current.delete(meeting.id);
      }
    };

    const check = () => {
      const now = new Date();
      for (const meeting of meetingsRef.current) {
        if (isReminderDue(meeting, userId, now)) void fire(meeting);
      }
    };

    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [companyId, userId, queryClient, t, i18n.language]);
}
