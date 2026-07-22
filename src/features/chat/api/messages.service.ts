import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ChatMessage } from "../types/chat.types";
import { ConversationsService } from "./conversations.service";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapMessage(
  conversationId: string,
  id: string,
  data: Record<string, unknown>
): ChatMessage {
  return {
    id,
    conversationId,
    senderId: String(data.senderId ?? ""),
    body: String(data.body ?? ""),
    messageType: "text",
    createdAt: toIso(data.createdAt),
    editedAt: data.editedAt ? toIso(data.editedAt) : null,
    deletedAt: data.deletedAt ? toIso(data.deletedAt) : null,
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
  subscribeToMessages(
    companyId: string,
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe {
    const q = query(messagesRef(companyId, conversationId), orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((snap) =>
        mapMessage(
          conversationId,
          snap.id,
          snap.data() as Record<string, unknown>
        )
      );
      callback(messages);
    });
  },

  async sendMessage(
    companyId: string,
    conversationId: string,
    senderId: string,
    body: string
  ): Promise<string> {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message body is empty");

    const docRef = await addDoc(messagesRef(companyId, conversationId), {
      senderId,
      body: trimmed,
      messageType: "text",
      createdAt: serverTimestamp(),
      editedAt: null,
      deletedAt: null,
    });

    await ConversationsService.updateLastMessage(
      companyId,
      conversationId,
      trimmed
    );

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
      }
    );
  },
};
