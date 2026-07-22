import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Spinner } from "@heroui/react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/stores/auth.store";
import { useMessages } from "../hooks/use-messages";
import { useTyping, usePresenceMap } from "../hooks/use-presence";
import { PresenceDot } from "./PresenceDot";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import type { PresenceStatus } from "../types/chat.types";

interface ConversationViewProps {
  conversationId?: string;
  peer?: User;
}

export function ConversationView({
  conversationId,
  peer,
}: ConversationViewProps) {
  const { t, i18n } = useTranslation("chat");
  const userId = useAuthStore((s) => s.user?.id);
  const presence = usePresenceMap();
  const {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useMessages(conversationId);
  const { typingUserIds, notifyTyping, stopTyping } = useTyping(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingUserIds.length]);

  const peerStatus: PresenceStatus = peer
    ? presence[peer.id]?.status ?? "offline"
    : "offline";

  const statusLabel = useMemo(() => {
    if (!peer) return "";
    if (peerStatus === "online") return t("conversation.online");
    if (peerStatus === "away") return t("conversation.away");
    if (peerStatus === "busy") return t("conversation.busy");
    const lastSeen = presence[peer.id]?.lastSeenAt;
    if (!lastSeen) return t("conversation.offline");
    try {
      const time = new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSeen));
      return t("conversation.lastSeen", { time });
    } catch {
      return t("conversation.offline");
    }
  }, [peer, peerStatus, presence, t, i18n.language]);

  const typingLabel = useMemo(() => {
    if (!typingUserIds.length || !peer) return null;
    if (typingUserIds.includes(peer.id)) {
      return t("conversation.typingOne", { name: peer.name });
    }
    return null;
  }, [typingUserIds, peer, t]);

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-full bg-default-100 p-4">
          <MessageSquare className="h-8 w-8 text-default-400" />
        </div>
        <div>
          <p className="text-base font-bold">{t("conversation.select")}</p>
          <p className="mt-1 text-sm text-default-400">
            {t("conversation.selectHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-default-100 px-4 py-3">
        <div className="relative">
          <Avatar src={peer?.avatar} name={peer?.name ?? "?"} size="sm" />
          <PresenceDot
            status={peerStatus}
            className="absolute bottom-0 end-0"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {peer?.name ?? "…"}
          </p>
          <p className="truncate text-xs text-default-400">
            {typingLabel ?? statusLabel}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="sm" />
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.senderId === userId}
              onEdit={async (messageId, body) => {
                try {
                  await editMessage({ messageId, body });
                } catch {
                  toast.error(t("errors.sendFailed"));
                }
              }}
              onDelete={async (messageId) => {
                try {
                  await deleteMessage(messageId);
                } catch {
                  toast.error(t("errors.sendFailed"));
                }
              }}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        onTyping={notifyTyping}
        onStopTyping={stopTyping}
        onSend={async (body) => {
          try {
            await sendMessage(body);
          } catch {
            toast.error(t("errors.sendFailed"));
            throw new Error("send failed");
          }
        }}
      />
    </div>
  );
}
