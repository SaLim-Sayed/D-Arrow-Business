import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  inferMessageType,
  previewForMessage,
  type ChatAttachment,
  type ChatMessage,
  type MessageType,
} from "../types/chat.types";
import { ConversationsService } from "./conversations.service";
import { normalizeMimeType } from "./chat-storage.service";

export interface SendMessageOptions {
  mentionedUserIds?: string[];
  mentionsEveryone?: boolean;
  /** Set to post the message as a reply inside a thread. */
  parentMessageId?: string | null;
  attachments?: ChatAttachment[];
  messageType?: MessageType;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapAttachments(raw: unknown): ChatAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const data = item as Record<string, unknown>;
      const url = String(data.url ?? "");
      if (!url) return null;
      return {
        url,
        name: String(data.name ?? "file"),
        mimeType: normalizeMimeType(String(data.mimeType ?? "")),
        sizeBytes: typeof data.sizeBytes === "number" ? data.sizeBytes : 0,
        durationMs:
          typeof data.durationMs === "number" ? data.durationMs : undefined,
      } satisfies ChatAttachment;
    })
    .filter((item): item is ChatAttachment => item !== null);
}

function mapMessageType(
  raw: unknown,
  attachments: ChatAttachment[]
): MessageType {
  if (
    raw === "text" ||
    raw === "file" ||
    raw === "image" ||
    raw === "audio"
  ) {
    return raw;
  }
  return inferMessageType(attachments);
}

function mapMessage(
  conversationId: string,
  id: string,
  data: Record<string, unknown>
): ChatMessage {
  const attachments = mapAttachments(data.attachments);
  return {
    id,
    conversationId,
    senderId: String(data.senderId ?? ""),
    body: String(data.body ?? ""),
    messageType: mapMessageType(data.messageType, attachments),
    createdAt: toIso(data.createdAt),
    editedAt: data.editedAt ? toIso(data.editedAt) : null,
    deletedAt: data.deletedAt ? toIso(data.deletedAt) : null,
    attachments,
    mentionedUserIds: Array.isArray(data.mentionedUserIds)
      ? (data.mentionedUserIds as string[])
      : [],
    mentionsEveryone: data.mentionsEveryone === true,
    parentMessageId: data.parentMessageId
      ? String(data.parentMessageId)
      : null,
    replyCount: typeof data.replyCount === "number" ? data.replyCount : 0,
    lastReplyAt: data.lastReplyAt ? toIso(data.lastReplyAt) : null,
  };
}

function messagesRef(companyId: string, conversationId: string) {
  return collection(
    db,
    "companies",
    companyId,
    "conversations",
    conversationId,
    "messages"
  );
}

export const MessagesService = {
  /** Root messages only. Thread replies are fetched per-thread. */
  subscribeToMessages(
    companyId: string,
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const q = query(messagesRef(companyId, conversationId), orderBy("createdAt", "asc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs
          .map((snap) =>
            mapMessage(
              conversationId,
              snap.id,
              snap.data() as Record<string, unknown>
            )
          )
          // Filtered client-side: messages predating threads have no
          // parentMessageId field at all, so a Firestore == null filter
          // would silently drop every one of them.
          .filter((message) => !message.parentMessageId);
        callback(messages);
      },
      (error) => {
        console.error("subscribeToMessages failed", error);
        callback([]);
      }
    );
  },

  subscribeToThread(
    companyId: string,
    conversationId: string,
    parentMessageId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const q = query(
      messagesRef(companyId, conversationId),
      where("parentMessageId", "==", parentMessageId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      callback(
        snapshot.docs.map((snap) =>
          mapMessage(
            conversationId,
            snap.id,
            snap.data() as Record<string, unknown>
          )
        )
      );
    });
  },

  async sendMessage(
    companyId: string,
    conversationId: string,
    senderId: string,
    body: string,
    options?: SendMessageOptions
  ): Promise<string> {
    const trimmed = body.trim();
    const attachments = (options?.attachments ?? [])
      .filter((item) => Boolean(item?.url))
      .map((item) => ({
        url: item.url,
        name: item.name || "file",
        mimeType: normalizeMimeType(item.mimeType) || "application/octet-stream",
        sizeBytes: item.sizeBytes || 0,
        ...(typeof item.durationMs === "number"
          ? { durationMs: item.durationMs }
          : {}),
      }));

    if (!trimmed && attachments.length === 0) {
      throw new Error("Message body is empty");
    }

    const messageType =
      options?.messageType ?? inferMessageType(attachments);
    const parentMessageId = options?.parentMessageId ?? null;
    const preview = previewForMessage(trimmed, messageType, attachments);

    // Client timestamp so the message appears in ordered queries immediately
    // (serverTimestamp stays null locally and can be missing from orderBy results).
    const docRef = await addDoc(messagesRef(companyId, conversationId), {
      senderId,
      body: trimmed,
      messageType,
      createdAt: Timestamp.now(),
      editedAt: null,
      deletedAt: null,
      attachments,
      mentionedUserIds: options?.mentionedUserIds ?? [],
      mentionsEveryone: options?.mentionsEveryone === true,
      ...(parentMessageId ? { parentMessageId } : { parentMessageId: null }),
      replyCount: 0,
      lastReplyAt: null,
    });

    if (parentMessageId) {
      // Keeps "N replies" on the root message without reading the thread.
      await updateDoc(
        doc(
          db,
          "companies",
          companyId,
          "conversations",
          conversationId,
          "messages",
          parentMessageId
        ),
        { replyCount: increment(1), lastReplyAt: serverTimestamp() }
      );
    }

    // Don't fail the send if inbox preview update fails — the message is already stored.
    try {
      await ConversationsService.updateLastMessage(
        companyId,
        conversationId,
        preview
      );
    } catch (error) {
      console.error("updateLastMessage failed", error);
    }

    return docRef.id;
  },

  async editMessage(
    companyId: string,
    conversationId: string,
    messageId: string,
    body: string
  ): Promise<void> {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message body is empty");

    await updateDoc(
      doc(
        db,
        "companies",
        companyId,
        "conversations",
        conversationId,
        "messages",
        messageId
      ),
      {
        body: trimmed,
        editedAt: serverTimestamp(),
      }
    );

    await ConversationsService.updateLastMessage(
      companyId,
      conversationId,
      trimmed
    );
  },

  async softDeleteMessage(
    companyId: string,
    conversationId: string,
    messageId: string
  ): Promise<void> {
    await updateDoc(
      doc(
        db,
        "companies",
        companyId,
        "conversations",
        conversationId,
        "messages",
        messageId
      ),
      {
        deletedAt: serverTimestamp(),
        body: "",
        attachments: [],
      }
    );
  },
};
