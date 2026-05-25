import emailjs from "@emailjs/browser";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NotificationsService } from "@/features/notifications/api/notifications.service";
import type { NotificationType } from "@/features/notifications/types/notification.types";

export const AttendanceNotificationService = {
  async getAdminsToNotify(companyId: string): Promise<Map<string, string>> {
    const usersToNotify = new Map<string, string>(); // userId -> email

    // We specifically target Khouloud and Salem (or anyone with admin/super_admin role)
    const targetEmails = ["khulodahmed390@gmail.com", "salemsayed981@gmail.com"];

    const adminsQuery = query(
      collection(db, "users"),
      where("companyId", "==", companyId)
    );
    const adminsSnap = await getDocs(adminsQuery);
    
    adminsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.email && 
        (targetEmails.includes(data.email) || data.role === "admin" || data.role === "super_admin")
      ) {
        usersToNotify.set(docSnap.id, data.email);
      }
    });

    return usersToNotify;
  },

  async dispatchNotifications(
    companyId: string,
    employeeName: string,
    actionType: "Started Work" | "Resumed Work" | "Checked Out",
    notifType: NotificationType,
    totalTimeStr: string = "N/A"
  ) {
    try {
      const usersToNotify = await this.getAdminsToNotify(companyId);

      if (usersToNotify.size === 0) {
        console.warn("[AttendanceNotification] No admins found to notify.");
        return;
      }

      // 1. Send In-App Notifications
      const inAppPromises = Array.from(usersToNotify.keys()).map((userId) => {
        return NotificationsService.createNotification(companyId, {
          userId,
          type: notifType,
          title: `Attendance: ${actionType}`,
          message: `${employeeName} has ${actionType.toLowerCase()}.${totalTimeStr !== "N/A" ? ` Total time: ${totalTimeStr}` : ""}`,
          link: "/people", // Link admins to the people dashboard
        }).catch((err) => console.error(`[AttendanceNotification] Failed in-app notif for ${userId}`, err));
      });
      await Promise.allSettled(inAppPromises);

      // 2. Send EmailJS Emails
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
      // Note: User needs to create this template in EmailJS Dashboard
      const templateId = (import.meta.env.VITE_EMAILJS_ATTENDANCE_TEMPLATE_ID as string) || (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string);
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

      if (serviceId && templateId && publicKey) {
        const emailPromises = Array.from(usersToNotify.values()).map((email) => {
          return emailjs.send(
            serviceId,
            templateId,
            {
              to_email: email,
              employee_name: employeeName,
              action_type: actionType,
              total_time: totalTimeStr,
            },
            { publicKey }
          ).catch((err) => {
              console.error(`[AttendanceNotification] Failed email to ${email}`, err);
          });
        });
        await Promise.allSettled(emailPromises);
      } else {
        console.warn("[AttendanceNotification] Skipping EmailJS (env variables missing).");
      }
    } catch (error) {
      console.error("[AttendanceNotification] Error dispatching:", error);
    }
  },

  async notifyWorkStarted(companyId: string, employeeName: string) {
    return this.dispatchNotifications(companyId, employeeName, "Started Work", "attendance_started");
  },

  async notifyWorkResumed(companyId: string, employeeName: string) {
    return this.dispatchNotifications(companyId, employeeName, "Resumed Work", "attendance_resumed");
  },

  async notifyShiftCompleted(companyId: string, employeeName: string, totalSeconds: number) {
    // Format total time (e.g. 8h 30m)
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const totalTimeStr = `${hours}h ${minutes}m`;

    return this.dispatchNotifications(companyId, employeeName, "Checked Out", "attendance_completed", totalTimeStr);
  }
};
