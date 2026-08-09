export type PresenceStatus = "online" | "away" | "busy" | "offline";

export type ConversationType = "dm" | "channel";

/**
 * Public channels are discoverable and joinable by any company member.
 * Private channels are invite-only.
 */
export type ChannelVisibility = "public" | "private";

export type MessageType = "text" | "file" | "image" | "audio";

/** Uploaded media attached to a chat message. */
export interface ChatAttachment {
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Voice notes only. */
  durationMs?: number;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  memberIds: string[];
  /** Sorted uid pair joined by `_` for DM uniqueness. Empty string on channels. */
  participantKey: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  createdBy: string;
  createdAt: string;
  /** Channel-only. Undefined on DMs. */
  name?: string;
  slug?: string;
  topic?: string;
  visibility?: ChannelVisibility;
  /** Announcement channels: only admins may post. */
  readOnly?: boolean;
  archivedAt?: string | null;
}

export interface Channel extends Conversation {
  type: "channel";
  name: string;
  slug: string;
  visibility: ChannelVisibility;
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
  attachments?: ChatAttachment[];
  /** Resolved at send time so reads never have to re-parse the body. */
  mentionedUserIds?: string[];
  /** True when the message mentioned the whole channel. */
  mentionsEveryone?: boolean;
  /** Set on replies. Root messages leave this null. */
  parentMessageId?: string | null;
  /** Maintained on the root message so the list can show "N replies". */
  replyCount?: number;
  lastReplyAt?: string | null;
}

export function inferMessageType(
  attachments: ChatAttachment[] | undefined
): MessageType {
  if (!attachments?.length) return "text";
  const file = attachments[0];
  const mime = (file.mimeType || "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    mime.startsWith("audio/") ||
    ["webm", "ogg", "mp3", "m4a", "wav", "aac"].includes(ext)
  ) {
    return "audio";
  }
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return "image";
  }
  return "file";
}

export function previewForMessage(
  body: string,
  messageType: MessageType,
  attachments?: ChatAttachment[]
): string {
  const trimmed = body.trim();
  if (trimmed) return trimmed;
  if (messageType === "audio") return "🎤 Voice message";
  if (messageType === "image") return "🖼️ Image";
  if (attachments?.[0]?.name) return `📎 ${attachments[0].name}`;
  return "📎 Attachment";
}

/** A person who can be mentioned. Kept minimal so the parser stays testable. */
export interface MentionCandidate {
  id: string;
  name: string;
}

/** Matches @ followed by a run of letters, numbers, dots, underscores or spaces. */
const MENTION_PATTERN = /@([\p{L}\p{N}._]+(?:\s+[\p{L}\p{N}._]+)*)/gu;

export const EVERYONE_TOKENS = ["channel", "all", "everyone", "الجميع", "الكل"];

/**
 * Resolves @mentions in a message body against known people.
 *
 * Names contain spaces, so the parser walks each candidate longest-first and
 * takes the longest name that matches at the mention position — otherwise
 * "@Salem Sayed" would only ever resolve the "Salem" prefix.
 */
export function parseMentions(
  body: string,
  candidates: MentionCandidate[]
): { userIds: string[]; everyone: boolean } {
  const userIds = new Set<string>();
  let everyone = false;

  const byLength = [...candidates].sort(
    (a, b) => b.name.length - a.name.length
  );

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const raw = match[1];
    const lowered = raw.toLowerCase();

    if (EVERYONE_TOKENS.some((token) => lowered.startsWith(token))) {
      everyone = true;
      continue;
    }

    const hit = byLength.find((candidate) =>
      lowered.startsWith(candidate.name.toLowerCase())
    );
    if (hit) userIds.add(hit.id);
  }

  return { userIds: [...userIds], everyone };
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

export function isChannel(conversation: Conversation): conversation is Channel {
  return conversation.type === "channel";
}

/**
 * Channel names are shown in Arabic as often as English here, so the slug keeps
 * any unicode letter rather than stripping to ASCII — which would leave Arabic
 * names with an empty slug.
 */
export function slugifyChannelName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug;
}

export type MentionToken =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; userId: string | null };

/**
 * Splits a body into plain text and mention tokens for rendering.
 * `userId` is null for @channel / @everyone, which highlights but targets nobody.
 */
export function tokenizeMentions(
  body: string,
  candidates: MentionCandidate[]
): MentionToken[] {
  const byLength = [...candidates].sort(
    (a, b) => b.name.length - a.name.length
  );
  const tokens: MentionToken[] = [];
  let cursor = 0;

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const start = match.index ?? 0;
    const raw = match[1];
    const lowered = raw.toLowerCase();

    const everyoneToken = EVERYONE_TOKENS.find((token) =>
      lowered.startsWith(token)
    );
    const hit = everyoneToken
      ? null
      : byLength.find((candidate) =>
          lowered.startsWith(candidate.name.toLowerCase())
        );

    if (!everyoneToken && !hit) continue;

    const matchedText = everyoneToken ?? hit?.name ?? "";
    // The regex is greedy across spaces, so only consume the part that
    // actually resolved and let the rest fall back to plain text.
    const consumed = raw.slice(0, matchedText.length);

    if (start > cursor) {
      tokens.push({ type: "text", value: body.slice(cursor, start) });
    }

    tokens.push({
      type: "mention",
      value: `@${consumed}`,
      userId: hit?.id ?? null,
    });

    cursor = start + 1 + consumed.length;
  }

  if (cursor < body.length) {
    tokens.push({ type: "text", value: body.slice(cursor) });
  }

  return tokens;
}
