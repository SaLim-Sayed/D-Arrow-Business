import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { CrmNotificationsService } from "../api/notifications.service";
import type { CrmNotification } from "../types/notifications.types";

export function useCrmNotificationsQuery() {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["crm", companyId, "notifications", userId],
    queryFn: async () => {
      const res = await CrmNotificationsService.getNotifications(companyId!);
      return res.data.filter((n) => n.userId === userId);
    },
    enabled: !!companyId && !!userId,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationReadMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (id: string) =>
      CrmNotificationsService.updateNotification(companyId!, id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", companyId, "notifications", userId] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: async (notifications: CrmNotification[]) => {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) => CrmNotificationsService.updateNotification(companyId!, n.id, { read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", companyId, "notifications", userId] });
    },
  });
}

export function useUnreadNotificationCount() {
  const { data } = useCrmNotificationsQuery();
  return data?.filter((n) => !n.read).length ?? 0;
}
