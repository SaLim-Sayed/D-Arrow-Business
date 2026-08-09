import { useState } from "react";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { normalizeMimeType } from "../api/chat-storage.service";
import type { ChatAttachment } from "../types/chat.types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms?: number): string {
  if (!ms || ms < 0) return "";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isAudioAttachment(file: ChatAttachment): boolean {
  const mime = normalizeMimeType(file.mimeType);
  if (mime.startsWith("audio/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["webm", "ogg", "mp3", "m4a", "mp4", "wav", "aac"].includes(ext);
}

function AudioPlayer({
  file,
  isMine,
}: {
  file: ChatAttachment;
  isMine: boolean;
}) {
  const { t } = useTranslation("chat");
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs",
          isMine
            ? "bg-primary-foreground/10 hover:bg-primary-foreground/15"
            : "bg-background/80 hover:bg-background"
        )}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold">{t("composer.voiceMessage")}</span>
        {file.durationMs ? (
          <span className="opacity-70">{formatDuration(file.durationMs)}</span>
        ) : null}
      </a>
    );
  }

  return (
    <div className="min-w-[16rem] max-w-full space-y-1">
      <audio
        controls
        preload="metadata"
        src={file.url}
        className="w-full max-w-xs"
        style={{ height: 40 }}
        onError={() => setFailed(true)}
      >
        <track kind="captions" />
      </audio>
      <p
        className={cn(
          "text-[10px]",
          isMine ? "text-primary-foreground/70" : "text-default-400"
        )}
      >
        {t("composer.voiceMessage")}
        {file.durationMs ? ` · ${formatDuration(file.durationMs)}` : ""}
      </p>
    </div>
  );
}

interface MessageAttachmentsProps {
  attachments: ChatAttachment[];
  isMine: boolean;
}

export function MessageAttachments({
  attachments,
  isMine,
}: MessageAttachmentsProps) {
  if (!attachments.length) return null;

  return (
    <div className="mt-1 space-y-2">
      {attachments.map((file) => {
        const mime = normalizeMimeType(file.mimeType);

        if (isAudioAttachment(file)) {
          return <AudioPlayer key={file.url} file={file} isMine={isMine} />;
        }

        if (mime.startsWith("image/")) {
          return (
            <a
              key={file.url}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl"
            >
              <img
                src={file.url}
                alt={file.name}
                className="max-h-64 max-w-full rounded-xl object-cover"
                loading="lazy"
              />
            </a>
          );
        }

        return (
          <a
            key={file.url}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors",
              isMine
                ? "bg-primary-foreground/10 hover:bg-primary-foreground/15"
                : "bg-background/80 hover:bg-background"
            )}
          >
            {mime.startsWith("image/") ? (
              <ImageIcon className="h-4 w-4 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file.name}</p>
              <p
                className={cn(
                  "text-[10px]",
                  isMine ? "text-primary-foreground/70" : "text-default-400"
                )}
              >
                {formatBytes(file.sizeBytes)}
              </p>
            </div>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </a>
        );
      })}
    </div>
  );
}
