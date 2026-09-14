import { uploadStorageFile } from "@/lib/storage-utils";
import type { ChatAttachment } from "../types/chat.types";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/x-m4a",
  "audio/m4a",
]);

const ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "webm",
  "ogg",
  "mp3",
  "m4a",
  "wav",
  "aac",
]);

/** Browsers often append codecs; Storage metadata prefers the base type. */
export function normalizeMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase();
  return base || "application/octet-stream";
}

export function isAllowedChatFile(file: File): boolean {
  const mime = normalizeMimeType(file.type);
  if (ALLOWED_MIME.has(mime)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.has(ext);
}

function extensionForMime(mimeType: string, fallbackName?: string): string {
  const fromName = fallbackName?.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;

  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/aac": "aac",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "application/pdf": "pdf",
  };
  return map[mimeType] ?? "bin";
}

async function uploadBytesToChat(
  companyId: string,
  conversationId: string,
  file: File | Blob,
  options?: { fileName?: string; mimeType?: string },
): Promise<ChatAttachment> {
  const mimeType = normalizeMimeType(
    options?.mimeType || (file instanceof File ? file.type : "") || "application/octet-stream",
  );
  const fileName =
    options?.fileName ||
    (file instanceof File ? file.name : `file.${extensionForMime(mimeType)}`);
  const id = Math.random().toString(36).slice(2, 12);
  const ext = extensionForMime(mimeType, fileName);
  const path = `chat/${companyId}/${conversationId}/${id}.${ext}`;

  const url = await uploadStorageFile(path, file, mimeType);

  return {
    name: fileName,
    url,
    mimeType,
    sizeBytes: file.size,
  };
}

export async function uploadChatFile(
  companyId: string,
  conversationId: string,
  file: File,
): Promise<ChatAttachment> {
  if (!isAllowedChatFile(file)) {
    throw new Error("This file type is not allowed");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is too large (max 25MB)");
  }
  return uploadBytesToChat(companyId, conversationId, file);
}

export async function uploadChatAudio(
  companyId: string,
  conversationId: string,
  blob: Blob,
  durationMs: number,
): Promise<ChatAttachment> {
  if (blob.size <= 0) {
    throw new Error("Recording is empty");
  }
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new Error("Voice note is too large (max 10MB)");
  }

  const mimeType = normalizeMimeType(
    blob.type?.startsWith("audio/") ? blob.type : "audio/webm",
  );
  const ext = extensionForMime(mimeType);
  const uploaded = await uploadBytesToChat(companyId, conversationId, blob, {
    fileName: `voice-${Date.now()}.${ext}`,
    mimeType,
  });

  return {
    ...uploaded,
    durationMs: Math.max(0, Math.round(durationMs)),
  };
}

/** @deprecated Prefer uploadChatFile / uploadChatAudio */
export async function uploadChatAttachment(
  companyId: string,
  conversationId: string,
  file: File | Blob,
  options?: { fileName?: string; mimeType?: string },
): Promise<ChatAttachment> {
  return uploadBytesToChat(companyId, conversationId, file, options);
}
