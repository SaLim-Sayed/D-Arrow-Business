import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Pause,
  Play,
  X,
} from "lucide-react";
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
  if (!ms || ms < 0) return "0:00";
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

function VoiceNotePlayer({
  file,
  isMine,
}: {
  file: ChatAttachment;
  isMine: boolean;
}) {
  const { t } = useTranslation("chat");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(file.durationMs ?? 0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return;
      setProgress(audio.currentTime / audio.duration);
    };
    const onMeta = () => {
      if (audio.duration && !Number.isNaN(audio.duration)) {
        setDuration(audio.duration * 1000);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setFailed(true);
    }
  };

  const seek = (event: MouseEvent<HTMLButtonElement>) => {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width)
    );
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  };

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
            : "bg-default-100 hover:bg-default-200/70"
        )}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className="font-semibold">{t("composer.voiceMessage")}</span>
      </a>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-[14rem] max-w-xs items-center gap-2.5 rounded-2xl px-2.5 py-2",
        isMine ? "bg-primary-foreground/10" : "bg-default-100/90"
      )}
    >
      <audio
        ref={audioRef}
        src={file.url}
        preload="metadata"
        className="hidden"
        onError={() => setFailed(true)}
      >
        <track kind="captions" />
      </audio>
      <button
        type="button"
        onClick={() => void toggle()}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95",
          isMine
            ? "bg-primary-foreground text-primary"
            : "bg-primary text-primary-foreground"
        )}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="ms-0.5 h-3.5 w-3.5 fill-current" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="relative block h-1.5 w-full overflow-hidden rounded-full bg-black/10"
          onClick={seek}
          aria-label="Seek"
        >
          <span
            className={cn(
              "absolute inset-y-0 start-0 rounded-full",
              isMine ? "bg-primary-foreground" : "bg-primary"
            )}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </button>
        <div
          className={cn(
            "mt-1 flex justify-between text-[10px] tabular-nums",
            isMine ? "text-primary-foreground/70" : "text-default-500"
          )}
        >
          <span>{t("composer.voiceMessage")}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function ImageAttachment({ file }: { file: ChatAttachment }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/image relative block max-w-full overflow-hidden rounded-xl text-start"
      >
        <img
          src={file.url}
          alt={file.name}
          className="max-h-72 max-w-full rounded-xl object-cover transition duration-300 group-hover/image:scale-[1.02]"
          loading="lazy"
        />
        <span className="pointer-events-none absolute inset-0 rounded-xl bg-black/0 transition group-hover/image:bg-black/10" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[90vh] max-w-[min(96vw,56rem)] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
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
    <div className={cn("space-y-2", attachments[0] && "mt-1.5")}>
      {attachments.map((file) => {
        const mime = normalizeMimeType(file.mimeType);

        if (isAudioAttachment(file)) {
          return <VoiceNotePlayer key={file.url} file={file} isMine={isMine} />;
        }

        if (mime.startsWith("image/")) {
          return <ImageAttachment key={file.url} file={file} />;
        }

        return (
          <a
            key={file.url}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-colors",
              isMine
                ? "bg-primary-foreground/10 hover:bg-primary-foreground/15"
                : "bg-default-100 hover:bg-default-200/80"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                isMine
                  ? "bg-primary-foreground/15"
                  : "bg-content1 text-default-500"
              )}
            >
              {mime.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
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
