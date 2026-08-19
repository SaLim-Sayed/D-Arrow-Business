/**
 * Thin wrapper around the Web Notifications API.
 *
 * Permission must be requested from a user gesture (Safari enforces this), so
 * every caller hangs it off a button press rather than asking on load.
 */

export function browserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function browserNotificationPermission(): NotificationPermission | null {
  return browserNotificationsSupported() ? Notification.permission : null;
}

export async function requestBrowserNotifications(): Promise<NotificationPermission | null> {
  if (!browserNotificationsSupported()) return null;
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function showBrowserNotification(options: {
  title: string;
  body: string;
  /** Same tag replaces an earlier alert instead of stacking a duplicate. */
  tag?: string;
  onClick?: () => void;
}): void {
  if (!browserNotificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    const notification = new Notification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: "/favicon.ico",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      options.onClick?.();
    };
  } catch {
    // Some browsers only allow notifications from a service worker — ignore.
  }
}
