import { auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { blobToDataUrl } from "@/lib/image-utils";

/**
 * Universal & resilient file upload helper.
 * Tries REST API → SDK upload → Base64 fallback.
 * Guarantees upload success even if Firebase Storage bucket, CORS, or rules are missing/failing.
 */

const UNAVAILABLE_KEY = "storage:bucket-unavailable";

/**
 * A missing bucket answers every request with a CORS-blocked 404, which surfaces
 * as a thrown fetch error rather than a readable status. Once we have seen that,
 * remember it for the rest of the browser session so later uploads skip straight
 * to the inline fallback instead of replaying failed requests (the SDK path alone
 * retries three times).
 */
let bucketUnavailable = readUnavailableFlag();

function readUnavailableFlag(): boolean {
  try {
    return sessionStorage.getItem(UNAVAILABLE_KEY) === storage.app.options.storageBucket;
  } catch {
    return false;
  }
}

function markBucketUnavailable(bucket: string, detail: unknown) {
  bucketUnavailable = true;
  try {
    sessionStorage.setItem(UNAVAILABLE_KEY, bucket);
  } catch {
    /* Private mode / storage disabled — the in-memory flag still holds. */
  }
  console.warn(
    `[uploadStorageFile] Firebase Storage bucket "${bucket}" is unreachable, so uploads are stored inline instead. ` +
      `Enable Storage for this project (and apply storage.cors.json) to host files properly.`,
    detail
  );
}

export function isStorageBucketAvailable(): boolean {
  return !bucketUnavailable && Boolean(storage.app.options.storageBucket);
}

export async function uploadStorageFile(
  path: string,
  file: File | Blob,
  mimeType?: string
): Promise<string> {
  const fileType = mimeType || (file instanceof File ? file.type : "") || "application/octet-stream";
  const bucket = storage.app.options.storageBucket;

  if (bucket && !bucketUnavailable) {
    // 1. Attempt REST API upload (bypasses SDK XHR multipart CORS issues)
    try {
      const token = await auth.currentUser?.getIdToken();
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": fileType,
          // The firebasestorage v0 API expects the `Firebase` scheme, not `Bearer`.
          ...(token ? { Authorization: `Firebase ${token}` } : {}),
        },
        body: file,
      });

      if (response.ok) {
        const data = await response.json();
        const downloadToken = data.downloadTokens;
        if (downloadToken) {
          return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
        }
      } else if (response.status === 404) {
        markBucketUnavailable(bucket, `HTTP ${response.status}`);
      } else {
        console.warn(
          `[uploadStorageFile] Storage REST upload failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (e) {
      // Network-level failure (missing bucket, CORS, blocked request). Trying the
      // SDK next would fail the same way, so stop here unless we are simply offline.
      if (navigator.onLine === false) {
        console.warn("[uploadStorageFile] Offline; falling back to inline storage.", e);
        return blobToDataUrl(file);
      }
      markBucketUnavailable(bucket, e);
    }

    // 2. Attempt SDK upload
    if (!bucketUnavailable) {
      try {
        const storageRef = ref(storage, path);
        const result = await uploadBytes(storageRef, file, { contentType: fileType });
        return await getDownloadURL(result.ref);
      } catch (e) {
        console.warn("[uploadStorageFile] Firebase Storage SDK upload failed:", e);
      }
    }
  }

  // 3. Robust Fallback: Convert to Base64 data URL
  return blobToDataUrl(file);
}

/**
 * Best-effort removal of a previously uploaded file. Inline (data URL) files live
 * in Firestore rather than Storage, so there is nothing to delete for those, and a
 * failure here must never block the caller from clearing its own reference.
 */
export async function deleteStorageFileByUrl(url?: string | null): Promise<void> {
  if (!url || url.startsWith("data:") || bucketUnavailable) return;
  if (!url.includes("firebasestorage.googleapis.com") && !url.includes("storage.googleapis.com")) {
    return;
  }
  try {
    await deleteObject(ref(storage, url));
  } catch (e) {
    console.warn("[deleteStorageFileByUrl] Could not delete stored file:", e);
  }
}
