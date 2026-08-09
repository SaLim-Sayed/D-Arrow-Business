import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Textarea } from "@heroui/react";
import {
  Mic,
  Paperclip,
  Send,
  Smile,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isAllowedChatFile } from "../api/chat-storage.service";
import type { MentionCandidate } from "../types/chat.types";
import { EmojiPicker } from "./EmojiPicker";

/** Partial @token immediately before the caret, if the caret sits in one. */
const ACTIVE_MENTION = /@([\p{L}\p{N}._]*)$/u;

const MAX_SUGGESTIONS = 6;
const MAX_PENDING_FILES = 5;

export interface ComposerSendPayload {
  body: string;
  files?: File[];
  audio?: { blob: Blob; durationMs: number };
}

interface ComposerProps {
  onSend: (payload: ComposerSendPayload) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  candidates?: MentionCandidate[];
  placeholder?: string;
}

function pickAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  if (isSafari) {
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg";
  return "";
}

function normalizeRecorderMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase() || "audio/webm";
}

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Composer({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
  candidates = [],
  placeholder,
}: ComposerProps) {
  const { t } = useTranslation("chat");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [caret, setCaret] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<{
    blob: Blob;
    durationMs: number;
  } | null>(null);
  const typingTimeout = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRootRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("audio/webm");
  const onStopTypingRef = useRef(onStopTyping);
  onStopTypingRef.current = onStopTyping;

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearRecorderTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Unmount-only cleanup — do not depend on callback identity or recording
  // will be discarded on parent re-renders.
  useEffect(() => {
    return () => {
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      onStopTypingRef.current();
      clearRecorderTimer();
      stopTracks();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.ondataavailable = null;
          recorder.onstop = null;
          recorder.onerror = null;
          recorder.stop();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!showEmoji) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!emojiRootRef.current?.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showEmoji]);

  const suggestions = useMemo(() => {
    if (!candidates.length) return [];
    const match = ACTIVE_MENTION.exec(value.slice(0, caret));
    if (!match) return [];
    const term = match[1].toLowerCase();

    const seen = new Set<string>();
    const out: MentionCandidate[] = [];
    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      if (term && !candidate.name.toLowerCase().includes(term)) continue;
      seen.add(candidate.id);
      out.push(candidate);
      if (out.length === MAX_SUGGESTIONS) break;
    }
    return out;
  }, [candidates, value, caret]);

  const applyMention = (candidate: MentionCandidate) => {
    const before = value.slice(0, caret);
    const match = ACTIVE_MENTION.exec(before);
    if (!match) return;

    const start = before.length - match[0].length;
    const next = `${value.slice(0, start)}@${candidate.name} ${value.slice(caret)}`;
    const nextCaret = start + candidate.name.length + 2;

    setValue(next);
    setHighlight(0);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
      setCaret(nextCaret);
    });
  };

  const insertAtCaret = (text: string) => {
    const start = inputRef.current?.selectionStart ?? value.length;
    const end = inputRef.current?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    const nextCaret = start + text.length;
    setValue(next);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
      setCaret(nextCaret);
    });
    onTyping();
  };

  const handleChange = (next: string) => {
    setValue(next);
    setHighlight(0);
    if (!next.trim()) {
      onStopTyping();
      return;
    }
    onTyping();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!isAllowedChatFile(file)) {
        toast.error(t("errors.unsupportedFile"));
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;
    setFiles((prev) => [...prev, ...accepted].slice(0, MAX_PENDING_FILES));
  };

  const submit = async (override?: {
    files?: File[];
    audio?: { blob: Blob; durationMs: number };
  }) => {
    const body = value.trim();
    const pendingFiles = override?.files ?? files;
    const audio = override?.audio ?? pendingAudio ?? undefined;
    const hasMedia = Boolean(pendingFiles.length || audio);

    if ((!body && !hasMedia) || disabled || sending) return;

    setSending(true);
    try {
      await onSend({
        body,
        files: pendingFiles.length ? pendingFiles : undefined,
        audio,
      });
      setValue("");
      setFiles([]);
      setPendingAudio(null);
      setShowEmoji(false);
      onStopTyping();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(detail ? `${t("errors.sendFailed")}: ${detail}` : t("errors.sendFailed"));
      throw error;
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (disabled || sending || recording || pendingAudio) return;
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      toast.error(t("errors.micUnsupported"));
      return;
    }

    const mimeType = pickAudioMime();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      mimeTypeRef.current = normalizeRecorderMime(recorder.mimeType || mimeType);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setRecordMs(0);
      setPendingAudio(null);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearRecorderTimer();
        stopTracks();
        mediaRecorderRef.current = null;
        setRecording(false);
        toast.error(t("errors.sendFailed"));
      };

      // Timeslice keeps chunks flowing on Safari/Firefox/Android.
      recorder.start(250);
      setRecording(true);
      setShowEmoji(false);
      timerRef.current = window.setInterval(() => {
        setRecordMs(Date.now() - startedAtRef.current);
      }, 200);
    } catch {
      stopTracks();
      toast.error(t("errors.micDenied"));
    }
  };

  const stopRecorder = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        reject(new Error("Recorder inactive"));
        return;
      }

      const mime = mimeTypeRef.current;
      const finish = () => {
        clearRecorderTimer();
        stopTracks();
        mediaRecorderRef.current = null;
        setRecording(false);

        // Brief delay: some Android Chrome builds deliver the last chunk
        // slightly after onstop.
        window.setTimeout(() => {
          const blob = new Blob(chunksRef.current, { type: mime });
          chunksRef.current = [];
          resolve(blob);
        }, 80);
      };

      recorder.onstop = finish;
      try {
        if (recorder.state === "recording") recorder.requestData();
      } catch {
        // ignore — stop still flushes on most browsers
      }
      try {
        recorder.stop();
      } catch {
        finish();
      }
    });
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    chunksRef.current = [];
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = () => {
        clearRecorderTimer();
        stopTracks();
        mediaRecorderRef.current = null;
        setRecording(false);
      };
      try {
        recorder.stop();
      } catch {
        clearRecorderTimer();
        stopTracks();
        mediaRecorderRef.current = null;
        setRecording(false);
      }
    } else {
      clearRecorderTimer();
      stopTracks();
      setRecording(false);
    }
    setPendingAudio(null);
  };

  const finishRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }
    const durationMs = Date.now() - startedAtRef.current;
    try {
      const blob = await stopRecorder();
      if (blob.size < 256 || durationMs < 400) {
        toast.error(t("errors.recordingTooShort"));
        return;
      }
      // Keep the note ready — user taps Send to upload (clearer + more reliable).
      setPendingAudio({ blob, durationMs });
    } catch {
      setRecording(false);
      clearRecorderTimer();
      stopTracks();
      toast.error(t("errors.sendFailed"));
    }
  };

  const discardPendingAudio = () => {
    setPendingAudio(null);
  };

  const syncCaret = () => {
    const position = inputRef.current?.selectionStart;
    if (typeof position === "number") setCaret(position);
  };

  const canSend = Boolean(
    (value.trim() || files.length || pendingAudio) && !disabled && !sending
  );

  return (
    <div className="relative shrink-0 chat-composer-shell p-3 sm:p-3.5">
      {suggestions.length > 0 && (
        <ul className="absolute bottom-full start-3 end-3 z-20 mb-2 max-h-56 overflow-y-auto rounded-2xl border border-default-200/80 bg-content1 py-1.5 shadow-premium">
          {suggestions.map((candidate, index) => (
            <li key={`${candidate.id}-${candidate.name}`}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyMention(candidate);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition-colors",
                  index === highlight ? "bg-primary/10" : "hover:bg-default-100"
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-default-100 text-xs font-bold text-default-500">
                  @
                </span>
                <span className="truncate font-semibold">{candidate.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmoji && !recording && !pendingAudio && (
        <div ref={emojiRootRef} className="absolute bottom-full start-3 z-20 mb-2">
          <EmojiPicker
            onPick={(emoji) => {
              insertAtCaret(emoji);
            }}
          />
        </div>
      )}

      {files.length > 0 && !recording && (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex max-w-[14rem] items-center gap-2 rounded-xl border border-default-200/80 bg-default-50 px-2.5 py-1.5 text-xs shadow-sm"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-default-400" />
              <span className="truncate font-medium">{file.name}</span>
              <button
                type="button"
                className="rounded-md p-0.5 text-default-400 hover:bg-danger/10 hover:text-danger"
                aria-label={t("composer.removeFile")}
                onClick={() =>
                  setFiles((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
          </span>
          <p className="flex-1 text-sm font-semibold tabular-nums text-danger">
            {t("composer.recording")} · {formatTimer(recordMs)}
          </p>
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            radius="full"
            aria-label={t("conversation.cancel")}
            onPress={cancelRecording}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            color="primary"
            isIconOnly
            radius="full"
            aria-label={t("composer.stopRecording")}
            onPress={() => void finishRecording()}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        </div>
      ) : pendingAudio ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Mic className="h-4 w-4" />
          </div>
          <p className="flex-1 text-sm font-semibold tabular-nums">
            {t("composer.voiceReady")} · {formatTimer(pendingAudio.durationMs)}
          </p>
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            radius="full"
            aria-label={t("composer.removeFile")}
            isDisabled={sending}
            onPress={discardPendingAudio}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            color="primary"
            isIconOnly
            radius="full"
            className="shadow-sm"
            aria-label={t("conversation.send")}
            isLoading={sending}
            isDisabled={disabled || sending}
            onPress={() => void submit({ audio: pendingAudio })}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-1 rounded-2xl border border-default-200/80 bg-default-50/70 p-1.5 shadow-sm focus-within:border-primary/35 focus-within:bg-content1 focus-within:ring-2 focus-within:ring-primary/10">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <Button
            size="sm"
            variant="light"
            isIconOnly
            radius="full"
            aria-label={t("composer.attach")}
            isDisabled={disabled || sending}
            onPress={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="light"
            isIconOnly
            radius="full"
            aria-label={t("composer.emoji")}
            isDisabled={disabled || sending}
            onPress={() => setShowEmoji((open) => !open)}
          >
            <Smile className="h-4 w-4" />
          </Button>

          <Textarea
            ref={inputRef}
            minRows={1}
            maxRows={5}
            value={value}
            onValueChange={handleChange}
            onSelect={syncCaret}
            onClick={syncCaret}
            onKeyUp={syncCaret}
            onFocus={() => setShowEmoji(false)}
            placeholder={placeholder ?? t("conversation.placeholder")}
            variant="flat"
            classNames={{
              base: "flex-1",
              inputWrapper:
                "bg-transparent shadow-none hover:bg-transparent group-data-[focus=true]:bg-transparent px-1",
              input: "text-sm",
            }}
            isDisabled={disabled || sending}
            onKeyDown={(e) => {
              if (suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => (h + 1) % suggestions.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight(
                    (h) => (h - 1 + suggestions.length) % suggestions.length
                  );
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  applyMention(suggestions[highlight]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setCaret(0);
                  return;
                }
              }
              if (e.key === "Escape" && showEmoji) {
                e.preventDefault();
                setShowEmoji(false);
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />

          {canSend ? (
            <Button
              color="primary"
              isIconOnly
              radius="full"
              className="shadow-sm"
              aria-label={t("conversation.send")}
              isLoading={sending}
              isDisabled={!canSend}
              onPress={() => void submit()}
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              color="primary"
              variant="flat"
              isIconOnly
              radius="full"
              aria-label={t("composer.record")}
              isDisabled={disabled || sending}
              onPress={() => void startRecording()}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
