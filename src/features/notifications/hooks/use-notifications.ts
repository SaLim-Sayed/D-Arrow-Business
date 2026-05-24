import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationsService } from "../api/notifications.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuth } from "@/features/auth/context/auth-context";
import { toast } from "sonner";
import type { AppNotification } from "../types/notification.types";

const NOTIFICATIONS_QUERY_KEY = "notifications";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  useEffect(() => {
    if (!companyId || !user?.id) return;

    let previousNotifications: AppNotification[] = [];

    const unsubscribe = NotificationsService.subscribeToNotifications(
      companyId,
      user.id,
      (notifications) => {
        // Update the React Query cache manually with the new real-time data
        queryClient.setQueryData(
          [NOTIFICATIONS_QUERY_KEY, companyId, user.id],
          notifications
        );

        // Check for new unread notifications to trigger toast
        if (previousNotifications.length > 0) {
          const newNotifications = notifications.filter(
            (n) =>
              !previousNotifications.find((prev) => prev.id === n.id) && !n.isRead
          );

          newNotifications.forEach((n) => {
            toast.info(n.title, {
              description: n.message,
              duration: 5000,
            });
          });
        }

        previousNotifications = notifications;
      }
    );

    return () => unsubscribe();
  }, [companyId, user?.id, queryClient]);

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, companyId, user?.id],
    queryFn: () => NotificationsService.getNotifications(companyId!, user!.id),
    enabled: !!companyId && !!user?.id,
    staleTime: Infinity, // Rely on the subscription instead of polling
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => 
      NotificationsService.markAsRead(companyId!, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY, companyId, user?.id] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () => 
      NotificationsService.markAllAsRead(companyId!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY, companyId, user?.id] });
    },
  });
}
