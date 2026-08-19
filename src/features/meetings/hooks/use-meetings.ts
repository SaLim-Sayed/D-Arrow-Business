import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { MeetingsService } from "../api/meetings.service";
import type {
  CreateMeetingDTO,
  UpdateMeetingDTO,
} from "../types/meeting.types";

export function useMeetingsQuery() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.meetings.list(companyId!),
    queryFn: () => MeetingsService.getMeetings(companyId!),
    enabled: !!companyId,
    // Reminders are checked against this data, so keep it reasonably fresh.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateMeetingMutation() {
  const { t } = useTranslation("meetings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetingDTO) =>
      MeetingsService.createMeeting(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings.all });
      toast.success(t("toast.created"));
    },
    onError: () => toast.error(t("toast.createFailed")),
  });
}

export function useUpdateMeetingMutation() {
  const { t } = useTranslation("meetings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingDTO }) =>
      MeetingsService.updateMeeting(companyId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings.all });
      toast.success(t("toast.updated"));
    },
    onError: () => toast.error(t("toast.updateFailed")),
  });
}

export function useDeleteMeetingMutation() {
  const { t } = useTranslation("meetings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MeetingsService.deleteMeeting(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.meetings.all });
      toast.success(t("toast.deleted"));
    },
    onError: () => toast.error(t("toast.deleteFailed")),
  });
}
