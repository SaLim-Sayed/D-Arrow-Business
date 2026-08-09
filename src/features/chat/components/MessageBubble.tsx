import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Button, Input } from "@heroui/react";
import { Clock3, MessageSquareReply, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageBody } from "./MessageBody";
import { MessageAttachments } from "./MessageAttachments";
import type { ChatMessage, MentionCandidate } from "../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  candidates?: MentionCandidate[];
  senderName?: string;
  senderAvatar?: string;
  onReply?: (message: ChatMessage) => void;
  onOpenThread?: (message: ChatMessage) => void;
  mentionsMe?: boolean;
  /** First bubble in a same-sender cluster (shows avatar/name). */
  isClusterStart?: boolean;
  /** Last bubble in a same-sender cluster (shows timestamp). */
  isClusterEnd?: boolean;
}

export function MessageBubble({
  message,
  isMine,
  onEdit,
  onDelete,
  candidates = [],
  senderName,
  senderAvatar,
  onReply,
  onOpenThread,
  mentionsMe = false,
  isClusterStart = true,
  isClusterEnd = true,
}: MessageBubbleProps) {
  const { t, i18n } = useTranslation("chat");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [busy, setBusy] = useState(false);
  const canEditText = Boolean(message.body.trim());
  const attachments = message.attachments ?? [];
  const showSenderMeta = !isMine && Boolean(senderName) && isClusterStart;
  const isPending = message.id.startsWith("pending-");

  const time = (() => {
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(message.createdAt));
    } catch {
      return "";
    }
  })();

  if (message.deletedAt) {
    return (
      <div
        className={cn(
          "flex w-full px-0.5",
          isMine ? "justify-end" : "justify-start",
          !isClusterStart && "mt-0.5"
        )}
      >
        <div className="max-w-[min(78%,30rem)] rounded-2xl bg-default-100/70 px-3.5 py-2 text-xs italic text-default-400 ring-1 ring-default-100/60">
          {t("conversation.deleted")}
        </div>
      </div>
    );
  }

  const saveEdit = async () => {
    if (!draft.trim() || draft.trim() === message.body) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onEdit(message.id, draft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const actionBtn = cn(
    "rounded-lg p-1.5 transition-colors",
    isMine ? "hover:bg-primary-foreground/15" : "hover:bg-default-200/80"
  );

  const radius = cn(
    "rounded-2xl",
    isMine
      ? cn(
          isClusterStart && isClusterEnd && "rounded-ee-md",
          isClusterStart && !isClusterEnd && "rounded-ee-md rounded-be-md",
          !isClusterStart && isClusterEnd && "rounded-te-md rounded-ee-md",
          !isClusterStart && !isClusterEnd && "rounded-e-md"
        )
      : cn(
          isClusterStart && isClusterEnd && "rounded-es-md",
          isClusterStart && !isClusterEnd && "rounded-es-md rounded-bs-md",
          !isClusterStart && isClusterEnd && "rounded-ts-md rounded-es-md",
          !isClusterStart && !isClusterEnd && "rounded-s-md"
        )
  );

  return (
    <div
      className={cn(
        "group flex w-full items-end gap-2 px-0.5 animate-in fade-in slide-in-from-bottom-1 duration-200",
        isMine ? "justify-end" : "justify-start",
        isClusterStart ? "mt-2.5 first:mt-0" : "mt-0.5"
      )}
    >
      {!isMine && Boolean(senderName) && (
        <div className="mb-0.5 w-7 shrink-0">
          {showSenderMeta ? (
            <Avatar
              src={senderAvatar}
              name={senderName}
              className="h-7 w-7 text-[10px] ring-2 ring-background"
            />
          ) : (
            <span className="block h-7 w-7" aria-hidden />
          )}
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[min(78%,30rem)] px-3.5 py-2 text-sm leading-relaxed transition-opacity",
          radius,
          isMine
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-content1 text-default-900 shadow-sm ring-1 ring-default-100/80",
          mentionsMe &&
            !isMine &&
            "ring-2 ring-warning/45 ring-offset-2 ring-offset-background",
          isPending && "opacity-75"
        )}
      >
        {showSenderMeta && (
          <p className="mb-1 truncate text-[11px] font-bold text-primary">
            {senderName}
          </p>
        )}

        {editing ? (
          <div className="space-y-2">
            <Input
              size="sm"
              value={draft}
              onValueChange={setDraft}
              variant="bordered"
              radius="lg"
              classNames={{
                inputWrapper: isMine
                  ? "bg-primary-foreground/10 border-primary-foreground/30"
                  : undefined,
              }}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                radius="lg"
                isLoading={busy}
                onPress={() => void saveEdit()}
              >
                {t("conversation.save")}
              </Button>
              <Button
                size="sm"
                variant="light"
                radius="lg"
                onPress={() => {
                  setDraft(message.body);
                  setEditing(false);
                }}
              >
                {t("conversation.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {message.body.trim() ? (
              <MessageBody
                body={message.body}
                candidates={candidates}
                isMine={isMine}
              />
            ) : null}
            <MessageAttachments attachments={attachments} isMine={isMine} />
            {!message.body.trim() &&
              attachments.length === 0 &&
              message.messageType === "audio" && (
                <p className="text-sm font-medium">
                  {t("composer.voiceMessage")}
                </p>
              )}
            {!message.body.trim() &&
              attachments.length === 0 &&
              message.messageType !== "audio" &&
              message.messageType !== "text" && (
                <p className="text-sm font-medium">📎 Attachment</p>
              )}

            <div
              className={cn(
                "mt-1.5 flex items-center gap-1.5 text-[10px] leading-none",
                isMine ? "text-primary-foreground/65" : "text-default-400",
                !isClusterEnd && !isPending && "sm:opacity-0 sm:group-hover:opacity-100"
              )}
            >
              <span className="tabular-nums">{time}</span>
              {message.editedAt && <span>· {t("conversation.edited")}</span>}
              {isPending ? (
                <span className="ms-auto inline-flex items-center gap-1 opacity-80">
                  <Clock3 className="h-3 w-3" />
                </span>
              ) : (
                <span className="ms-auto inline-flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {onReply && (
                    <button
                      type="button"
                      className={actionBtn}
                      aria-label={t("thread.reply")}
                      onClick={() => onReply(message)}
                    >
                      <MessageSquareReply className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isMine && (
                    <>
                      {canEditText && (
                        <button
                          type="button"
                          className={actionBtn}
                          aria-label={t("conversation.edit")}
                          onClick={() => {
                            setDraft(message.body);
                            setEditing(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={actionBtn}
                        aria-label={t("conversation.delete")}
                        disabled={busy}
                        onClick={() => {
                          setBusy(true);
                          void onDelete(message.id).finally(() =>
                            setBusy(false)
                          );
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </span>
              )}
            </div>

            {Boolean(message.replyCount) && onOpenThread && (
              <button
                type="button"
                onClick={() => onOpenThread(message)}
                className={cn(
                  "mt-2 flex items-center gap-1.5 rounded-xl px-2 py-1 text-[11px] font-semibold transition-colors",
                  isMine
                    ? "bg-primary-foreground/12 text-primary-foreground/90 hover:bg-primary-foreground/18"
                    : "bg-primary/10 text-primary hover:bg-primary/15"
                )}
              >
                <MessageSquareReply className="h-3 w-3" />
                {t("thread.replies", { count: message.replyCount ?? 0 })}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
