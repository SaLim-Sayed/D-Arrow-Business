import type { Conversation } from "../types/chat.types";

export function isUnreadConversation(
  conversation: Conversation,
  userId: string | undefined,
  lastReadAt: string | undefined
): boolean {
  if (!userId || !conversation.lastMessageAt) return false;
  if (!lastReadAt) return true;
  return (
    new Date(conversation.lastMessageAt).getTime() >
    new Date(lastReadAt).getTime()
  );
}

export function countUnreadConversations(
  conversations: Conversation[],
  reads: Record<string, string>,
  userId: string | undefined
): number {
  if (!userId) return 0;
  return conversations.filter((conversation) =>
    isUnreadConversation(conversation, userId, reads[conversation.id])
  ).length;
}
