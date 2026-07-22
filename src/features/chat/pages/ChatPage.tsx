import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useConversations } from "../hooks/use-conversations";
import { InboxList } from "../components/InboxList";
import { ConversationView } from "../components/ConversationView";
import type { User } from "@/features/auth/types/auth.types";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const { conversations, reads, isLoading } = useConversations();
  const { data: users = [] } = useAllUsers();

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const user of users) map[user.id] = user;
    return map;
  }, [users]);

  const activeConversation = conversations.find((c) => c.id === conversationId);
  const peerId = activeConversation?.memberIds.find((id) => id !== userId);
  const peer = peerId ? usersById[peerId] : undefined;

  return (
    <div className="flex h-[calc(100dvh-var(--header-height)-1rem)] min-h-[420px] overflow-hidden rounded-2xl border border-default-100 bg-content1 shadow-sm md:h-[calc(100dvh-var(--header-height)-1.5rem)]">
      <div className="hidden w-full max-w-sm shrink-0 md:flex md:flex-col">
        <InboxList
          conversations={conversations}
          reads={reads}
          isLoading={isLoading}
          activeId={conversationId}
          usersById={usersById}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {!conversationId ? (
          <div className="flex h-full flex-col md:hidden">
            <InboxList
              conversations={conversations}
              reads={reads}
              isLoading={isLoading}
              usersById={usersById}
            />
          </div>
        ) : null}
        <div className={conversationId ? "flex h-full min-h-0 flex-col" : "hidden md:flex md:h-full md:min-h-0 md:flex-col"}>
          <ConversationView conversationId={conversationId} peer={peer} />
        </div>
      </div>
    </div>
  );
}
