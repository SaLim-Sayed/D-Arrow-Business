import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useConversations } from "../hooks/use-conversations";
import { InboxList } from "../components/InboxList";
import { ConversationView } from "../components/ConversationView";
import type { User } from "@/features/auth/types/auth.types";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { conversations, reads, isLoading } = useConversations();
  const { data: users = [] } = useAllUsers();

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const user of users) map[user.id] = user;
    return map;
  }, [users]);

  const activeConversation = conversations.find((c) => c.id === conversationId);
  const peerId =
    activeConversation && activeConversation.type === "dm"
      ? activeConversation.memberIds.find((id) => id !== userId)
      : undefined;
  const peer = peerId ? usersById[peerId] : undefined;
  const openConversation = (id: string) => navigate(`/chat/${id}`);

  return (
    <div className="flex h-full min-h-0 overflow-hidden border-y border-default-100/80 bg-content1 md:rounded-3xl md:border md:shadow-premium">
      <aside className="hidden w-full max-w-[22rem] shrink-0 border-e border-default-100/80 bg-content1 md:flex md:min-h-0 md:flex-col lg:max-w-sm">
        <InboxList
          conversations={conversations}
          reads={reads}
          isLoading={isLoading}
          activeId={conversationId}
          usersById={usersById}
          onSelectConversation={openConversation}
        />
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col chat-surface">
        {!conversationId ? (
          <div className="flex h-full min-h-0 flex-col bg-content1 md:hidden">
            <InboxList
              conversations={conversations}
              reads={reads}
              isLoading={isLoading}
              usersById={usersById}
              onSelectConversation={openConversation}
            />
          </div>
        ) : null}
        <div
          className={
            conversationId
              ? "flex h-full min-h-0 flex-col"
              : "hidden md:flex md:h-full md:min-h-0 md:flex-col"
          }
        >
          <ConversationView
            conversationId={conversationId}
            conversation={activeConversation}
            peer={peer}
          />
        </div>
      </main>
    </div>
  );
}
