import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar, Button, Spinner } from "@heroui/react";
import {
  ArrowDown,
  ChevronLeft,
  Hash,
  Lock,
  Megaphone,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/stores/auth.store";
import { isAdminRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useCompany } from "@/features/companies/context/company-context";
import { notifyMentions } from "../api/mention-notifications";
import { useMessages } from "../hooks/use-messages";
import { useTyping, usePresenceMap } from "../hooks/use-presence";
import { useChannelActions } from "../hooks/use-channels";
import { useChatScroll } from "../hooks/use-chat-scroll";
import { formatDayLabel, groupMessagesByDay } from "../utils/message-groups";
import { PresenceDot } from "./PresenceDot";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { ThreadPanel } from "./ThreadPanel";
import { ChannelMembersDialog } from "./ChannelMembersDialog";
import {
  isChannel,
  parseMentions,
  type ChatMessage,
  type Conversation,
  type MentionCandidate,
  type PresenceStatus,
} from "../types/chat.types";

interface ConversationViewProps {
  conversationId?: string;
  conversation?: Conversation;
  peer?: User;
}

export function ConversationView({
  conversationId,
  conversation,
  peer,
}: ConversationViewProps) {
  const { t, i18n } = useTranslation("chat");
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);
  const senderName = useAuthStore((s) => s.user?.name);
  const { companyId } = useCompany();
  const presence = usePresenceMap();
  const {
    messages,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useMessages(conversationId);
  const { typingUserIds, notifyTyping, stopTyping } = useTyping(conversationId);
  const { leaveChannel } = useChannelActions();
  const { data: users = [] } = useAllUsers();
  const [threadRoot, setThreadRoot] = useState<ChatMessage | null>(null);
  const [managingMembers, setManagingMembers] = useState(false);

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const user of users) map[user.id] = user;
    return map;
  }, [users]);

  // Both name forms resolve to the same person, so @Salem and @سالم both work.
  const mentionCandidates = useMemo<MentionCandidate[]>(() => {
    const list: MentionCandidate[] = [];
    for (const user of users) {
      if (user.name) list.push({ id: user.id, name: user.name });
      if (user.nameAr && user.nameAr !== user.name) {
        list.push({ id: user.id, name: user.nameAr });
      }
    }
    return list;
  }, [users]);

  const channel = conversation && isChannel(conversation) ? conversation : null;

  const channelMembersPreview = useMemo(() => {
    if (!channel) return [];
    return channel.memberIds
      .map((id) => usersById[id])
      .filter((user): user is User => Boolean(user))
      .slice(0, 4);
  }, [channel, usersById]);

  const typingLabel = useMemo(() => {
    if (!typingUserIds.length) return null;
    if (channel) {
      const others = typingUserIds.filter((id) => id !== userId);
      if (!others.length) return null;
      return t("conversation.typing", { names: others.length });
    }
    if (peer && typingUserIds.includes(peer.id)) {
      return t("conversation.typingOne", { name: peer.name });
    }
    return null;
  }, [typingUserIds, peer, channel, userId, t]);

  // followKey also tracks typing so the sticky view reveals the indicator.
  const { containerRef, bottomRef, showJump, onScroll, scrollToBottom } =
    useChatScroll(
      conversationId,
      messages.length + (typingLabel ? 1 : 0)
    );

  // After we send, force follow even if a layout race flipped stickToBottom.
  const prevCountRef = useRef(0);
  useEffect(() => {
    prevCountRef.current = 0;
  }, [conversationId]);
  useEffect(() => {
    const grew = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;
    if (!grew || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last?.senderId !== userId) return;
    const id = window.requestAnimationFrame(() => scrollToBottom("smooth"));
    return () => window.cancelAnimationFrame(id);
  }, [messages, userId, scrollToBottom]);

  const grouped = useMemo(() => groupMessagesByDay(messages), [messages]);

  /** Announcement channels accept posts from admins only. */
  const postingBlocked = Boolean(channel?.readOnly) && !isAdminRole(role);

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

  useEffect(() => {
    setThreadRoot(null);
  }, [conversationId]);

  const leave = async () => {
    if (!channel) return;
    try {
      await leaveChannel(channel.id);
      navigate("/chat");
    } catch (error) {
      console.error(error);
      toast.error(t("errors.leaveFailed"));
    }
  };

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-2xl" />
          <div className="relative rounded-[1.75rem] border border-default-100 bg-content1/90 p-6 shadow-premium">
            <MessageSquare className="h-9 w-9 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight">
            {t("conversation.select")}
          </p>
          <p className="mt-1.5 max-w-sm text-sm text-default-400">
            {t("conversation.selectHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-default-100/80 bg-content1/80 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4">
        <Button
          size="sm"
          variant="light"
          isIconOnly
          className="md:hidden"
          aria-label={t("nav.inbox")}
          onPress={() => navigate("/chat")}
        >
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>

        {channel ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
              channel.readOnly
                ? "bg-warning/15 text-warning"
                : channel.visibility === "private"
                  ? "bg-secondary/15 text-secondary"
                  : "bg-primary/10 text-primary"
            )}
          >
            {channel.readOnly ? (
              <Megaphone className="h-4 w-4" />
            ) : channel.visibility === "private" ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Hash className="h-4 w-4" />
            )}
          </div>
        ) : (
          <div className="relative shrink-0">
            <Avatar
              src={peer?.avatar}
              name={peer?.name ?? "?"}
              className="h-10 w-10"
            />
            <PresenceDot
              status={peerStatus}
              className="absolute bottom-0 end-0"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight">
            {channel ? channel.name : peer?.name ?? "…"}
          </p>
          <p className="truncate text-xs text-default-400">
            {typingLabel ??
              (channel
                ? channel.topic ||
                  t("channels.members", { count: channel.memberIds.length })
                : statusLabel)}
          </p>
        </div>

        {channel && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setManagingMembers(true)}
              className="group relative flex items-center rounded-full border border-default-100 bg-default-50/80 py-1 pe-2.5 ps-1.5 transition-colors hover:border-default-200 hover:bg-default-100"
              aria-label={t("channels.manageMembers")}
              title={t("channels.manageMembers")}
            >
              <span className="flex -space-x-2 rtl:space-x-reverse">
                {channelMembersPreview.length > 0 ? (
                  channelMembersPreview.map((user) => (
                    <Avatar
                      key={user.id}
                      src={user.avatar}
                      name={user.name}
                      className="h-6 w-6 text-[9px] ring-2 ring-content1"
                    />
                  ))
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-default-200 text-default-500 ring-2 ring-content1">
                    <Users className="h-3 w-3" />
                  </span>
                )}
              </span>
              <span className="ms-2 text-[11px] font-semibold text-default-500 group-hover:text-foreground">
                {channel.memberIds.length}
              </span>
            </button>
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              radius="full"
              aria-label={t("channels.addMembers")}
              onPress={() => setManagingMembers(true)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="light"
              className="hidden text-default-500 sm:inline-flex"
              onPress={() => void leave()}
            >
              {t("channels.leave")}
            </Button>
          </div>
        )}
      </header>

      {channel && (
        <ChannelMembersDialog
          isOpen={managingMembers}
          onOpenChange={setManagingMembers}
          channel={channel}
        />
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="chat-scroll absolute inset-0 space-y-2 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-content1 shadow-sm ring-1 ring-default-100">
                <MessageSquare className="h-5 w-5 text-default-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-default-700">
                  {t("conversation.empty")}
                </p>
                <p className="mt-1 text-xs text-default-400">
                  {t("conversation.emptyHint")}
                </p>
              </div>
            </div>
          ) : (
            grouped.map((item) =>
              item.type === "day" ? (
                <div
                  key={item.key}
                  className="sticky top-0 z-10 flex justify-center py-2"
                >
                  <span className="rounded-full border border-default-100/80 bg-content1/90 px-3 py-1 text-[11px] font-semibold text-default-500 shadow-sm backdrop-blur-md">
                    {formatDayLabel(item.date, i18n.language)}
                  </span>
                </div>
              ) : (
                <MessageBubble
                  key={item.key}
                  message={item.message}
                  isMine={item.message.senderId === userId}
                  senderName={
                    channel
                      ? usersById[item.message.senderId]?.name
                      : undefined
                  }
                  senderAvatar={
                    channel
                      ? usersById[item.message.senderId]?.avatar
                      : undefined
                  }
                  candidates={mentionCandidates}
                  mentionsMe={Boolean(
                    userId && item.message.mentionedUserIds?.includes(userId)
                  )}
                  onReply={setThreadRoot}
                  onOpenThread={setThreadRoot}
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
              )
            )
          )}

          {typingLabel && (
            <div className="flex items-center gap-2 px-1 py-1.5 text-xs text-default-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-content1/90 px-2.5 py-1 shadow-sm ring-1 ring-default-100/80">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-default-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-default-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-default-400 [animation-delay:300ms]" />
                </span>
                <span>{typingLabel}</span>
              </span>
            </div>
          )}

          <div ref={bottomRef} className="h-px shrink-0" />
        </div>

        {showJump && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
            <Button
              size="sm"
              color="primary"
              variant="shadow"
              radius="full"
              className="pointer-events-auto shadow-lg"
              startContent={<ArrowDown className="h-3.5 w-3.5" />}
              onPress={() => scrollToBottom("smooth")}
            >
              {t("conversation.jumpToLatest")}
            </Button>
          </div>
        )}
      </div>

      {postingBlocked ? (
        <div className="shrink-0 border-t border-default-100/80 bg-content1/90 px-4 py-4 text-center backdrop-blur-md">
          <p className="text-xs font-medium text-default-400">
            {t("channels.postingRestricted")}
          </p>
        </div>
      ) : (
        <Composer
          candidates={mentionCandidates}
          onTyping={notifyTyping}
          onStopTyping={stopTyping}
          onSend={async ({ body, files, audio }) => {
            const { userIds, everyone } = parseMentions(body, mentionCandidates);
            await sendMessage({
              body,
              files,
              audio,
              options: {
                mentionedUserIds: userIds,
                mentionsEveryone: everyone,
              },
            });
            scrollToBottom("smooth");

            if (companyId && conversationId && userId && userIds.length) {
              // Not awaited: the message is already delivered, and a failed
              // notification must not surface as a send failure.
              void notifyMentions({
                companyId,
                conversationId,
                senderId: userId,
                mentionedUserIds: userIds,
                title: t("notifications.mentionedYou", {
                  name: senderName ?? "",
                }),
                preview: body,
              });
            }
          }}
        />
      )}

      <ThreadPanel
        conversationId={conversationId}
        rootMessage={threadRoot}
        candidates={mentionCandidates}
        usersById={usersById}
        onClose={() => setThreadRoot(null)}
      />
    </div>
  );
}
