import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PresenceRecord, PresenceStatus, TypingRecord } from "../types/chat.types";

const TYPING_STALE_MS = 3000;

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export const PresenceService = {
  async setPresence(
    companyId: string,
    userId: string,
    status: PresenceStatus
  ): Promise<void> {
    await setDoc(
      doc(db, "companies", companyId, "presence", userId),
      {
        status,
        lastSeenAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  subscribeToPresence(
    companyId: string,
    callback: (presence: Record<string, PresenceRecord>) => void
  ): Unsubscribe {
    const presenceRef = collection(db, "companies", companyId, "presence");
    return onSnapshot(presenceRef, (snapshot) => {
      const map: Record<string, PresenceRecord> = {};
      for (const snap of snapshot.docs) {
        const data = snap.data();
        map[snap.id] = {
          userId: snap.id,
          status: (data.status as PresenceStatus) || "offline",
          lastSeenAt: toIso(data.lastSeenAt),
        };
      }
      callback(map);
    });
  },

  async setTyping(
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
        "typing",
        userId
      ),
      { updatedAt: serverTimestamp() },
      { merge: true }
    );
  },

  async clearTyping(
    companyId: string,
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      await deleteDoc(
        doc(
          db,
          "companies",
          companyId,
          "conversations",
          conversationId,
          "typing",
          userId
        )
      );
    } catch {
      // Doc may already be gone
    }
  },

  subscribeToTyping(
    companyId: string,
    conversationId: string,
    callback: (typing: TypingRecord[]) => void
  ): Unsubscribe {
    const typingRef = collection(
      db,
      "companies",
      companyId,
      "conversations",
      conversationId,
      "typing"
    );

    return onSnapshot(typingRef, (snapshot) => {
      const now = Date.now();
      const typing: TypingRecord[] = [];
      for (const snap of snapshot.docs) {
        const updatedAt = toIso(snap.data().updatedAt);
        if (now - new Date(updatedAt).getTime() > TYPING_STALE_MS) continue;
        typing.push({ userId: snap.id, updatedAt });
      }
      callback(typing);
    });
  },
};

export { TYPING_STALE_MS };
