export type PresenceStatus = "online" | "away" | "busy" | "offline";

export type ConversationType = "dm";

export type MessageType = "text";

export interface Conversation {
  id: string;
  type: ConversationType;
  memberIds: string[];
  /** Sorted uid pair joined by `_` for DM uniqueness */
  participantKey: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  messageType: MessageType;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export interface ConversationRead {
  userId: string;
  lastReadAt: string;
}

export interface PresenceRecord {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string;
}

export interface TypingRecord {
  userId: string;
  updatedAt: string;
}

export function buildParticipantKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join("_");
}
