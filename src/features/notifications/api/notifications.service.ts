import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppNotification, CreateNotificationDTO } from "../types/notification.types";

export const NotificationsService = {
  /** Fetch recent notifications for a user */
  async getNotifications(companyId: string, userId: string): Promise<AppNotification[]> {
    const notificationsRef = collection(db, "companies", companyId, "notifications");
    // Sort client-side to avoid needing an immediate composite index
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
      } as AppNotification;
    });

    // Sort by createdAt descending
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /** Subscribe to real-time notifications for a user */
  subscribeToNotifications(
    companyId: string,
    userId: string,
    callback: (notifications: AppNotification[]) => void
  ) {
    const notificationsRef = collection(db, "companies", companyId, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || new Date().toISOString(),
        } as AppNotification;
      });

      const sorted = notifications.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      callback(sorted);
    });
  },

  /** Create a new notification */
  async createNotification(companyId: string, data: CreateNotificationDTO): Promise<void> {
    const notificationsRef = collection(db, "companies", companyId, "notifications");
    await addDoc(notificationsRef, {
      ...data,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  },

  /** Mark a notification as read */
  async markAsRead(companyId: string, notificationId: string): Promise<void> {
    const docRef = doc(db, "companies", companyId, "notifications", notificationId);
    await updateDoc(docRef, {
      isRead: true,
    });
  },

  /** Mark all notifications as read for a user */
  async markAllAsRead(companyId: string, userId: string): Promise<void> {
    const notificationsRef = collection(db, "companies", companyId, "notifications");
    const q = query(notificationsRef, where("userId", "==", userId), where("isRead", "==", false));
    const snapshot = await getDocs(q);
    
    const promises = snapshot.docs.map((docSnap) => {
      return updateDoc(docSnap.ref, { isRead: true });
    });
    
    await Promise.all(promises);
  }
};
