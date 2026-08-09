  import {
  addDoc,
  arrayRemove,
  arrayUnion,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  slugifyChannelName,
  type ChannelVisibility,
  type Conversation,
} from "../types/chat.types";
import { conversationsRef, mapConversation } from "./conversations.service";

export interface CreateChannelInput {
  name: string;
  topic?: string;
  visibility: ChannelVisibility;
  /** Announcement channels: only admins may post. */
  readOnly?: boolean;
  /** Extra members invited at creation (creator is always included). */
  memberIds?: string[];
}

function channelDoc(companyId: string, channelId: string) {
  return doc(db, "companies", companyId, "conversations", channelId);
}

export const ChannelsService = {
  /**
   * Public channels the user can discover and join. Channels they are already
   * a member of arrive through the normal inbox subscription instead.
   */
  subscribeToPublicChannels(
    companyId: string,
    callback: (channels: Conversation[]) => void
  ): Unsubscribe {
    const q = query(
      conversationsRef(companyId),
      where("type", "==", "channel"),
      where("visibility", "==", "public"),
      limit(200)
    );

    return onSnapshot(q, (snapshot) => {
      const channels = snapshot.docs
        .map((snap) =>
          mapConversation(snap.id, snap.data() as Record<string, unknown>)
        )
        .filter((channel) => !channel.archivedAt);

      channels.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      callback(channels);
    });
  },

  async findBySlug(
    companyId: string,
    slug: string
  ): Promise<Conversation | null> {
    const q = query(
      conversationsRef(companyId),
      where("type", "==", "channel"),
      where("slug", "==", slug),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const snap = snapshot.docs[0];
    return mapConversation(snap.id, snap.data() as Record<string, unknown>);
  },

  async createChannel(
    companyId: string,
    userId: string,
    input: CreateChannelInput
  ): Promise<string> {
    const name = input.name.trim();
    if (!name) throw new Error("Channel name is required");

    const slug = slugifyChannelName(name);
    if (!slug) throw new Error("Channel name must contain letters or numbers");

    const existing = await ChannelsService.findBySlug(companyId, slug);
    if (existing) throw new Error("A channel with this name already exists");

    const memberIds = Array.from(
      new Set([userId, ...(input.memberIds ?? []).filter(Boolean)])
    );

    const docRef = await addDoc(conversationsRef(companyId), {
      type: "channel",
      name,
      slug,
      topic: input.topic?.trim() ?? "",
      visibility: input.visibility,
      readOnly: input.readOnly === true,
      // Creator + invited members so the channel shows in their inboxes.
      memberIds,
      // Only DMs use this; kept present so inbox queries stay uniform.
      participantKey: "",
      lastMessageAt: null,
      lastMessagePreview: "",
      createdBy: userId,
      createdAt: serverTimestamp(),
      archivedAt: null,
    });

    return docRef.id;
  },

  async joinChannel(
    companyId: string,
    channelId: string,
    userId: string
  ): Promise<void> {
    await updateDoc(channelDoc(companyId, channelId), {
      memberIds: arrayUnion(userId),
    });
  },

  /** Invite one or more company users into an existing channel. */
  async addMembers(
    companyId: string,
    channelId: string,
    userIds: string[]
  ): Promise<void> {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    if (!unique.length) return;
    await updateDoc(channelDoc(companyId, channelId), {
      memberIds: arrayUnion(...unique),
    });
  },

  async leaveChannel(
    companyId: string,
    channelId: string,
    userId: string
  ): Promise<void> {
    await updateDoc(channelDoc(companyId, channelId), {
      memberIds: arrayRemove(userId),
    });
  },

  async archiveChannel(companyId: string, channelId: string): Promise<void> {
    await updateDoc(channelDoc(companyId, channelId), {
      archivedAt: serverTimestamp(),
    });
  },
};
