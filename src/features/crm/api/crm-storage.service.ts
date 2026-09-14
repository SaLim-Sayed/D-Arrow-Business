import { withLogging } from "@/lib/service-utils";
import { uploadStorageFile } from "@/lib/storage-utils";

const SERVICE_NAME = "CrmStorageService";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export function isAllowedCrmFile(file: File): boolean {
  if (ALLOWED_MIME.includes(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "pdf", "xls", "xlsx", "doc", "docx"].includes(ext ?? "");
}

export async function uploadCrmAttachment(
  companyId: string,
  entityType: string,
  entityId: string,
  file: File
): Promise<{ fileUrl: string; mimeType: string; sizeBytes: number }> {
  return withLogging(SERVICE_NAME, "uploadCrmAttachment", (async () => {
    const ext = file.name.split(".").pop() ?? "bin";
    const randomId = Math.random().toString(36).substring(2, 15);
    const path = `crm/${companyId}/${entityType}/${entityId}/${randomId}.${ext}`;

    const fileUrl = await uploadStorageFile(path, file, file.type);
    return { fileUrl, mimeType: file.type || "application/octet-stream", sizeBytes: file.size };
  })());
}

