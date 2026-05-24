import emailjs from "@emailjs/browser";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task } from "../types/task.types";
import { NotificationsService } from "@/features/notifications/api/notifications.service";
import type { NotificationType } from "@/features/notifications/types/notification.types";

export const TaskNotificationService = {
  /**
   * Send an email notification when a task is updated or created.
   * 
   * @param task The task that was modified
   * @param companyId The company ID
   * @param updateType "created" | "updated" | "assigned"
   * @param currentUserEmail The email of the person making the change (to avoid emailing them)
   */
  async notifyTaskChange(
    task: Task | { id: string; title?: string; assigneeId?: string | null; reporterId?: string; [key: string]: any },
    companyId: string,
    updateType: "created" | "updated" | "assigned",
    currentUserEmail?: string
  ): Promise<void> {
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
      const templateId = (import.meta.env.VITE_EMAILJS_TASK_TEMPLATE_ID as string) || (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string);
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

      if (!serviceId || !templateId || !publicKey) {
        console.warn("[TaskNotification] EmailJS env variables are missing.");
        return;
      }

      const usersToNotify = new Map<string, string>(); // userId -> email

      // 1. Get reporter (owner) email
      if (task.reporterId) {
        const reporterSnap = await getDoc(doc(db, "users", task.reporterId));
        if (reporterSnap.exists()) {
          usersToNotify.set(task.reporterId, reporterSnap.data().email);
        }
      }

      // 2. Get assignee email
      if (task.assigneeId) {
        const assigneeSnap = await getDoc(doc(db, "users", task.assigneeId));
        if (assigneeSnap.exists()) {
          usersToNotify.set(task.assigneeId, assigneeSnap.data().email);
        }
      }

      // 3. Get admin emails
      const adminsQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId),
        where("role", "in", ["admin", "super_admin"])
      );
      const adminsSnap = await getDocs(adminsQuery);
      adminsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email) {
          usersToNotify.set(docSnap.id, data.email);
        }
      });

      // 4. Remove the person making the change
      if (currentUserEmail) {
        console.log(`[TaskNotification] Current user is ${currentUserEmail}. (Filter disabled for testing)`);
        // for (const [userId, email] of usersToNotify.entries()) {
        //   if (email === currentUserEmail) {
        //     usersToNotify.delete(userId);
        //   }
        // }
      }

      console.log(`[TaskNotification] Will notify users:`, Array.from(usersToNotify.entries()));

      if (usersToNotify.size === 0) {
        console.warn("[TaskNotification] No valid recipients found to notify.");
        return; // No one to notify
      }

      const taskLink = `/tasks/${task.id}`;
      const taskTitle = task.title || "Untitled Task";
      const actionBy = currentUserEmail || "Someone";
      const notifType: NotificationType = `task_${updateType}` as NotificationType;

      // 5. Send In-App Notifications
      const inAppPromises = Array.from(usersToNotify.keys()).map((userId) => {
        return NotificationsService.createNotification(companyId, {
          userId,
          type: notifType,
          title: `Task ${updateType}`,
          message: `The task "${taskTitle}" was ${updateType} by ${actionBy}.`,
          link: taskLink,
        }).catch((err) => console.error(`[TaskNotification] Failed to create in-app notification for ${userId}`, err));
      });
      await Promise.allSettled(inAppPromises);

      // 6. Send EmailJS Emails
      if (serviceId && templateId && publicKey) {
        const emailPromises = Array.from(usersToNotify.values()).map((email) => {
          return emailjs.send(
            serviceId,
            templateId,
            {
              to_email: email,
              task_title: taskTitle,
              update_type: updateType,
              action_by: actionBy,
              task_id: task.id,
              task_link: window.location.origin + taskLink,
            },
            { publicKey }
          ).catch((err) => {
              console.error(`[TaskNotification] Failed to send email to ${email}`, err);
          });
        });
        await Promise.allSettled(emailPromises);
      } else {
        console.warn("[TaskNotification] Skipping EmailJS because env variables are missing.");
      }
    } catch (error) {
      console.error("[TaskNotification] Error in notifyTaskChange:", error);
    }
  },
};
