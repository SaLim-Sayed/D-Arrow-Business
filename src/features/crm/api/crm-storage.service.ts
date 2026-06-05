import { auth, storage } from "@/lib/firebase";
import { withLogging } from "@/lib/service-utils";

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
    const bucket = storage.app.options.storageBucket;

    try {
      const token = await auth.currentUser?.getIdToken();
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      const downloadToken = data.downloadTokens;
      const fileUrl = downloadToken
        ? `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`
        : path;
      return { fileUrl, mimeType: file.type || "application/octet-stream", sizeBytes: file.size };
    } catch {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const fileUrl = await getDownloadURL(storageRef);
      return { fileUrl, mimeType: file.type || "application/octet-stream", sizeBytes: file.size };
    }
  })());
}
