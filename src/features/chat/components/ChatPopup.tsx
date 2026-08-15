import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
} from "@heroui/react";
import { useAuthStore } from "@/stores/auth.store";
import { useAllUsers } from "@/features/users/hooks/use-users";
import type { User } from "@/features/auth/types/auth.types";
import { useConversations } from "../hooks/use-conversations";
import { usePresenceHeartbeat } from "../hooks/use-presence";
import { InboxList } from "./InboxList";
import { ConversationView } from "./ConversationView";

interface ChatPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPopup({ isOpen, onOpenChange }: ChatPopupProps) {
  const { i18n } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const { conversations, reads, isLoading } = useConversations(isOpen);
  const { data: users = [] } = useAllUsers();
  const [conversationId, setConversationId] = useState<string>();

  usePresenceHeartbeat(isOpen);

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

  const close = () => onOpenChange(false);

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement={i18n.dir() === "rtl" ? "left" : "right"}
      size="full"
      hideCloseButton
      classNames={{
        base: "w-full sm:max-w-[420px] md:max-w-[440px]",
        body: "p-0",
        wrapper: "z-[60]",
      }}
    >
      <DrawerContent className="h-full bg-content1">
        <DrawerBody className="flex h-full min-h-0 flex-col overflow-hidden p-0">
          {isOpen &&
            (conversationId ? (
              <ConversationView
                conversationId={conversationId}
                conversation={activeConversation}
                peer={peer}
                showBack
                onBack={() => setConversationId(undefined)}
                onClose={close}
              />
            ) : (
              <InboxList
                conversations={conversations}
                reads={reads}
                isLoading={isLoading}
                usersById={usersById}
                onSelectConversation={setConversationId}
                onClose={close}
              />
            ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
