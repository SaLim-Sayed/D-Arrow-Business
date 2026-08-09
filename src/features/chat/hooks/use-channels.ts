import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { ChannelsService, type CreateChannelInput } from "../api/channels.service";
import type { Conversation } from "../types/chat.types";

/** Public channels in the company, split by whether the user has joined. */
export function usePublicChannels() {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  // Keyed by company so a company switch never shows the previous one's
  // channels, and so the effect never has to setState synchronously to clear.
  const [state, setState] = useState<{
    companyId: string | null;
    items: Conversation[];
  }>({ companyId: null, items: [] });

  useEffect(() => {
    if (!companyId) return;

    return ChannelsService.subscribeToPublicChannels(companyId, (items) => {
      setState({ companyId, items });
    });
  }, [companyId]);

  const channels = useMemo(
    () => (state.companyId === companyId ? state.items : []),
    [state, companyId]
  );
  const isLoading = Boolean(companyId) && state.companyId !== companyId;

  const { joined, discoverable } = useMemo(() => {
    if (!userId) return { joined: [], discoverable: channels };
    return {
      joined: channels.filter((c) => c.memberIds.includes(userId)),
      discoverable: channels.filter((c) => !c.memberIds.includes(userId)),
    };
  }, [channels, userId]);

  return { channels, joined, discoverable, isLoading };
}

export function useChannelActions() {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);

  const createChannel = useCallback(
    async (input: CreateChannelInput) => {
      if (!companyId || !userId) throw new Error("Not signed in");
      return ChannelsService.createChannel(companyId, userId, input);
    },
    [companyId, userId]
  );

  const joinChannel = useCallback(
    async (channelId: string) => {
      if (!companyId || !userId) throw new Error("Not signed in");
      return ChannelsService.joinChannel(companyId, channelId, userId);
    },
    [companyId, userId]
  );

  const leaveChannel = useCallback(
    async (channelId: string) => {
      if (!companyId || !userId) throw new Error("Not signed in");
      return ChannelsService.leaveChannel(companyId, channelId, userId);
    },
    [companyId, userId]
  );

  const addMembers = useCallback(
    async (channelId: string, memberIds: string[]) => {
      if (!companyId || !userId) throw new Error("Not signed in");
      return ChannelsService.addMembers(companyId, channelId, memberIds);
    },
    [companyId, userId]
  );

  return { createChannel, joinChannel, leaveChannel, addMembers };
}
