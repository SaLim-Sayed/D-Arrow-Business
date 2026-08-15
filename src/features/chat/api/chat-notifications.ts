import { NotificationsService } from "@/features/notifications/api/notifications.service";
import type { NotificationType } from "@/features/notifications/types/notification.types";
import {
  inferMessageType,
  previewForMessage,
  type Conversation,
} from "../types/chat.types";

const PREVIEW_LIMIT = 140;

export interface NotifyChatMessageInput {
  companyId: string;
  conversation: Conversation;
  senderId: string;
  senderName: string;
  mentionedUserIds: string[];
  mentionsEveryone: boolean;
  preview: string;
}

export interface ComposerPreviewInput {
  body: string;
  files?: File[];
  audio?: { blob: Blob; durationMs: number };
}

/**
 * Builds a short notification preview from whatever the composer just sent.
 * Body wins; otherwise we fall back to the same attachment labels the inbox uses.
 */
export function previewFromComposer({
  body,
  files,
  audio,
}: ComposerPreviewInput): string {
  if (audio) {
    return previewForMessage(body, "audio");
  }
  if (files?.length) {
    const attachments = files.map((file) => ({
      url: "",
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }));
    return previewForMessage(body, inferMessageType(attachments), attachments);
  }
  return previewForMessage(body, "text");
}

function clipPreview(preview: string): string {
  const trimmed = preview.trim();
  if (trimmed.length <= PREVIEW_LIMIT) return trimmed;
  return `${trimmed.slice(0, PREVIEW_LIMIT)}…`;
}

function uniqueRecipients(ids: string[], senderId: string): string[] {
  return [...new Set(ids)].filter((id) => id && id !== senderId);
}

async function fanOut(
  companyId: string,
  conversationId: string,
  type: NotificationType,
  senderName: string,
  preview: string,
  userIds: string[]
): Promise<void> {
  if (!userIds.length) return;

  const message = clipPreview(preview) || "…";

  await Promise.allSettled(
    userIds.map((userId) =>
      NotificationsService.createNotification(companyId, {
        userId,
        title: senderName,
        message,
        type,
        link: `/chat/${conversationId}`,
      })
    )
  );
}

/**
 * Notifies the people who should hear about a new chat message:
 * - DMs: the other participant
 * - @mentions: each named person
 * - @channel / @everyone: every other member
 *
 * Mentions win over a plain DM ping so the same person is not notified twice.
 * Fire-and-forget at the call site — a failed write must never look like a
 * failed send.
 */
export async function notifyChatMessage({
  companyId,
  conversation,
  senderId,
  senderName,
  mentionedUserIds,
  mentionsEveryone,
  preview,
}: NotifyChatMessageInput): Promise<void> {
  const members = uniqueRecipients(conversation.memberIds, senderId);
  const mentioned = new Set(
    uniqueRecipients(
      mentionsEveryone ? [...mentionedUserIds, ...members] : mentionedUserIds,
      senderId
    )
  );

  const mentionIds = [...mentioned];
  const messageIds =
    conversation.type === "dm"
      ? members.filter((id) => !mentioned.has(id))
      : [];

  const name = senderName.trim() || "Someone";

  await Promise.allSettled([
    fanOut(
      companyId,
      conversation.id,
      "chat_mention",
      name,
      preview,
      mentionIds
    ),
    fanOut(
      companyId,
      conversation.id,
      "chat_message",
      name,
      preview,
      messageIds
    ),
  ]);
}
