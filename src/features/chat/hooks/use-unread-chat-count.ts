import { useMemo } from "react";
import { countUnreadConversations } from "../utils/unread";
import { useConversations } from "./use-conversations";

export function useUnreadChatCount(enabled = true): number {
  const { conversations, reads, userId } = useConversations(enabled);

  return useMemo(
    () => countUnreadConversations(conversations, reads, userId),
    [conversations, reads, userId]
  );
}
