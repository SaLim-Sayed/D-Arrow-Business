import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Spinner,
} from "@heroui/react";
import { toast } from "sonner";
import type { User } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/features/companies/context/company-context";
import { notifyMentions } from "../api/mention-notifications";
import { useMessages, useThread } from "../hooks/use-messages";
import { useChatScroll } from "../hooks/use-chat-scroll";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import {
  parseMentions,
  type ChatMessage,
  type MentionCandidate,
} from "../types/chat.types";

interface ThreadPanelProps {
  conversationId: string | undefined;
  rootMessage: ChatMessage | null;
  candidates: MentionCandidate[];
  usersById?: Record<string, User>;
  onClose: () => void;
}

export function ThreadPanel({
  conversationId,
  rootMessage,
  candidates,
  usersById = {},
  onClose,
}: ThreadPanelProps) {
  const { t } = useTranslation("chat");
  const userId = useAuthStore((s) => s.user?.id);
  const senderName = useAuthStore((s) => s.user?.name);
  const { companyId } = useCompany();
  const { replies, isLoading } = useThread(conversationId, rootMessage?.id);
  const { sendMessage, editMessage, deleteMessage } = useMessages(conversationId);
  const { containerRef, bottomRef, showJump, onScroll, scrollToBottom } =
    useChatScroll(rootMessage?.id, replies.length);

  return (
    <Drawer
      isOpen={Boolean(rootMessage)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      placement="right"
      size="md"
      classNames={{
        base: "sm:max-w-md",
        body: "p-0",
      }}
    >
      <DrawerContent>
        <DrawerHeader className="border-b border-default-100/80 bg-content1/90">
          {t("thread.title")}
        </DrawerHeader>
        <DrawerBody className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0">
          {rootMessage && (
            <div className="shrink-0 border-b border-default-100/80 bg-default-50/60 px-4 py-3">
              <MessageBubble
                message={rootMessage}
                isMine={rootMessage.senderId === userId}
                senderName={usersById[rootMessage.senderId]?.name}
                senderAvatar={usersById[rootMessage.senderId]?.avatar}
                candidates={candidates}
                onEdit={async () => {}}
                onDelete={async () => {}}
              />
            </div>
          )}

          <div className="relative min-h-0 flex-1 chat-surface">
            <div
              ref={containerRef}
              onScroll={onScroll}
              className="chat-scroll absolute inset-0 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3"
            >
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : replies.length === 0 ? (
                <p className="py-8 text-center text-sm text-default-400">
                  {t("thread.noReplies")}
                </p>
              ) : (
                replies.map((reply) => (
                  <MessageBubble
                    key={reply.id}
                    message={reply}
                    isMine={reply.senderId === userId}
                    senderName={usersById[reply.senderId]?.name}
                    senderAvatar={usersById[reply.senderId]?.avatar}
                    candidates={candidates}
                    mentionsMe={Boolean(
                      userId && reply.mentionedUserIds?.includes(userId)
                    )}
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
              <div ref={bottomRef} className="h-px shrink-0" />
            </div>

            {showJump && (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
                <button
                  type="button"
                  className="pointer-events-auto rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md"
                  onClick={() => scrollToBottom("smooth")}
                >
                  {t("conversation.jumpToLatest")}
                </button>
              </div>
            )}
          </div>

          <Composer
            candidates={candidates}
            placeholder={t("thread.replyPlaceholder")}
            onTyping={() => {}}
            onStopTyping={() => {}}
            onSend={async ({ body, files, audio }) => {
              if (!rootMessage) return;
              const { userIds, everyone } = parseMentions(body, candidates);
              await sendMessage({
                body,
                files,
                audio,
                options: {
                  mentionedUserIds: userIds,
                  mentionsEveryone: everyone,
                  parentMessageId: rootMessage.id,
                },
              });
              scrollToBottom("smooth");

              if (companyId && conversationId && userId && userIds.length) {
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
