import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  buildParticipantKey,
  type Conversation,
} from "../types/chat.types";

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function mapConversation(
  id: string,
  data: Record<string, unknown>
): Conversation {
  return {
    id,
    type: "dm",
    memberIds: Array.isArray(data.memberIds)
      ? (data.memberIds as string[])
      : [],
    participantKey: String(data.participantKey ?? ""),
    lastMessageAt: toIso(data.lastMessageAt),
    lastMessagePreview: String(data.lastMessagePreview ?? ""),
    createdBy: String(data.createdBy ?? ""),
    createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
  };
}

function conversationsRef(companyId: string) {
  return collection(db, "companies", companyId, "conversations");
}

export const ConversationsService = {
  subscribeToInbox(
    companyId: string,
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): Unsubscribe {
    const q = query(
      conversationsRef(companyId),
      where("memberIds", "array-contains", userId),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map((snap) =>
        mapConversation(snap.id, snap.data() as Record<string, unknown>)
      );
      conversations.sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      callback(conversations);
    });
  },

  async findDmByParticipantKey(
    companyId: string,
    participantKey: string
  ): Promise<Conversation | null> {
    const q = query(
      conversationsRef(companyId),
      where("participantKey", "==", participantKey),
      where("type", "==", "dm"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const snap = snapshot.docs[0];
    return mapConversation(snap.id, snap.data() as Record<string, unknown>);
  },

  async findOrCreateDm(
    companyId: string,
    currentUserId: string,
    otherUserId: string
  ): Promise<Conversation> {
    if (currentUserId === otherUserId) {
      throw new Error("Cannot start a DM with yourself");
    }

    const participantKey = buildParticipantKey(currentUserId, otherUserId);
    const existing = await this.findDmByParticipantKey(
      companyId,
      participantKey
    );
    if (existing) return existing;

    const memberIds = [currentUserId, otherUserId].sort();
    const docRef = await addDoc(conversationsRef(companyId), {
      type: "dm",
      memberIds,
      participantKey,
      lastMessageAt: null,
      lastMessagePreview: "",
      createdBy: currentUserId,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      type: "dm",
      memberIds,
      participantKey,
      lastMessageAt: null,
      lastMessagePreview: "",
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };
  },

  async updateLastMessage(
    companyId: string,
    conversationId: string,
    preview: string
  ): Promise<void> {
    await updateDoc(doc(db, "companies", companyId, "conversations", conversationId), {
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: preview.slice(0, 200),
    });
  },

  subscribeToConversation(
    companyId: string,
    conversationId: string,
    callback: (conversation: Conversation | null) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, "companies", companyId, "conversations", conversationId),
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }
        callback(
          mapConversation(snap.id, snap.data() as Record<string, unknown>)
        );
      }
    );
  },

  async markRead(
    companyId: string,
    conversationId: string,
    userId: string
  ): Promise<void> {
    await setDoc(
      doc(
        db,
        "companies",
        companyId,
        "conversations",
        conversationId,
        "reads",
        userId
      ),
      { lastReadAt: serverTimestamp() },
      { merge: true }
    );
  },

  subscribeToReads(
    companyId: string,
    conversationId: string,
    callback: (reads: Record<string, string>) => void
  ): Unsubscribe {
    const readsRef = collection(
      db,
      "companies",
      companyId,
      "conversations",
      conversationId,
      "reads"
    );
    return onSnapshot(readsRef, (snapshot) => {
      const reads: Record<string, string> = {};
      for (const snap of snapshot.docs) {
        const iso = toIso(snap.data().lastReadAt);
        if (iso) reads[snap.id] = iso;
      }
      callback(reads);
    });
  },

  subscribeToInboxReads(
    companyId: string,
    conversationIds: string[],
    userId: string,
    callback: (reads: Record<string, string>) => void
  ): Unsubscribe {
    if (conversationIds.length === 0) {
      callback({});
      return () => undefined;
    }

    const unsubscribers: Unsubscribe[] = [];
    const reads: Record<string, string> = {};

    for (const conversationId of conversationIds) {
      const unsub = onSnapshot(
        doc(
          db,
          "companies",
          companyId,
          "conversations",
          conversationId,
          "reads",
          userId
        ),
        (snap) => {
          if (snap.exists()) {
            const iso = toIso(snap.data().lastReadAt);
            if (iso) reads[conversationId] = iso;
            else delete reads[conversationId];
          } else {
            delete reads[conversationId];
          }
          callback({ ...reads });
        }
      );
      unsubscribers.push(unsub);
    }

    return () => {
      unsubscribers.forEach((u) => u());
    };
  },
};
