import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { NotificationsService } from "../api/notifications.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuth } from "@/features/auth/context/auth-context";
import { toast } from "sonner";
import { showBrowserNotification } from "@/lib/browser-notifications";
import type { AppNotification } from "../types/notification.types";

const NOTIFICATIONS_QUERY_KEY = "notifications";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId || !user?.id) return;

    let previousNotifications: AppNotification[] = [];
    // The first snapshot is history, not news — alert only on what follows it.
    let receivedFirstSnapshot = false;

    const unsubscribe = NotificationsService.subscribeToNotifications(
      companyId,
      user.id,
      (notifications) => {
        // Update the React Query cache manually with the new real-time data
        queryClient.setQueryData(
          [NOTIFICATIONS_QUERY_KEY, companyId, user.id],
          notifications
        );

        if (receivedFirstSnapshot) {
          const newNotifications = notifications.filter(
            (n) =>
              !previousNotifications.find((prev) => prev.id === n.id) && !n.isRead
          );

          newNotifications.forEach((n) => {
            toast.info(n.title, {
              description: n.message,
              duration: 5000,
            });
            // Reaches the user even when the tab is in the background.
            showBrowserNotification({
              title: n.title,
              body: n.message,
              tag: n.id,
              onClick: () => {
                if (!n.link) return;
                if (n.link.startsWith("http")) window.location.assign(n.link);
                else navigate(n.link);
              },
            });
          });
        }

        receivedFirstSnapshot = true;
        previousNotifications = notifications;
      }
    );

    return () => unsubscribe();
  }, [companyId, user?.id, queryClient, navigate]);

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
