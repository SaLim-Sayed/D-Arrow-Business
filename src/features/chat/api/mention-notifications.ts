import { NotificationsService } from "@/features/notifications/api/notifications.service";

interface NotifyMentionsInput {
  companyId: string;
  conversationId: string;
  /** Excluded from the fan-out so nobody is notified about their own message. */
  senderId: string;
  mentionedUserIds: string[];
  title: string;
  preview: string;
}

const PREVIEW_LIMIT = 140;

/**
 * Fans a mention out to the people named in it.
 *
 * Deliberately fire-and-forget at the call site: a notification that fails to
 * write must never make a delivered message look like it failed to send.
 */
export async function notifyMentions({
  companyId,
  conversationId,
  senderId,
  mentionedUserIds,
  title,
  preview,
}: NotifyMentionsInput): Promise<void> {
  const recipients = [...new Set(mentionedUserIds)].filter(
    (id) => id && id !== senderId
  );

  if (!recipients.length) return;

  const message =
    preview.length > PREVIEW_LIMIT
      ? `${preview.slice(0, PREVIEW_LIMIT)}…`
      : preview;

  await Promise.allSettled(
    recipients.map((userId) =>
      NotificationsService.createNotification(companyId, {
        userId,
        title,
        message,
        type: "chat_mention",
        link: `/chat/${conversationId}`,
      })
    )
  );
}
