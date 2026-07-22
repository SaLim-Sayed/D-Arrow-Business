import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export function MessageBubble({
  message,
  isMine,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const { t, i18n } = useTranslation("chat");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [busy, setBusy] = useState(false);

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
          "flex w-full",
          isMine ? "justify-end" : "justify-start"
        )}
      >
        <div className="max-w-[75%] rounded-2xl bg-default-100 px-3 py-2 text-xs italic text-default-400">
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

  return (
    <div
      className={cn("group flex w-full", isMine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-default-100 text-default-900"
        )}
      >
        {editing ? (
          <div className="space-y-2">
            <Input
              size="sm"
              value={draft}
              onValueChange={setDraft}
              variant="bordered"
              classNames={{
                inputWrapper: isMine
                  ? "bg-primary-foreground/10 border-primary-foreground/30"
                  : undefined,
              }}
            />
            <div className="flex gap-1">
              <Button size="sm" color="primary" variant="flat" isLoading={busy} onPress={() => void saveEdit()}>
                {t("conversation.save")}
              </Button>
              <Button
                size="sm"
                variant="light"
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
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <div
              className={cn(
                "mt-1 flex items-center gap-2 text-[10px]",
                isMine ? "text-primary-foreground/70" : "text-default-400"
              )}
            >
              <span>{time}</span>
              {message.editedAt && <span>· {t("conversation.edited")}</span>}
              {isMine && (
                <span className="ms-auto hidden gap-1 group-hover:inline-flex">
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-black/10"
                    aria-label={t("conversation.edit")}
                    onClick={() => {
                      setDraft(message.body);
                      setEditing(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-black/10"
                    aria-label={t("conversation.delete")}
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void onDelete(message.id).finally(() => setBusy(false));
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
