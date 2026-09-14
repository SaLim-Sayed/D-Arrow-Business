import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { withLogging } from "@/lib/service-utils";
import { deleteStorageFileByUrl, uploadStorageFile } from "@/lib/storage-utils";
import { blobToDataUrl, compressImage } from "@/lib/image-utils";
import type { User } from "../types/auth.types";

const SERVICE_NAME = "ProfileService";

/** Firestore caps a single document at 1 MiB; keep inline avatars well under it. */
const MAX_INLINE_AVATAR_CHARS = 600_000;

const isDataUrl = (url?: string | null) => Boolean(url?.startsWith("data:"));

export interface UpdateProfileRequest {
  name: string;
  nameAr: string;
  avatarFile?: File | null;
  avatarUrl?: string | null;
}

export const ProfileService = {
  /**
   * Upload avatar to Firebase Storage or Base64 and return URL.
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    return withLogging(SERVICE_NAME, "uploadAvatar", (async () => {
      const compressed = await compressImage(file, { maxSize: 512, quality: 0.82 });
      const ext = compressed.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg");
      const path = `avatars/${userId}/avatar_${Date.now()}.${ext}`;
      const url = await uploadStorageFile(path, compressed, compressed.type);

      // Storage is unavailable and we got an inline data URL back: shrink it
      // further so it always fits inside the Firestore user document.
      if (isDataUrl(url) && url.length > MAX_INLINE_AVATAR_CHARS) {
        const thumb = await compressImage(file, { maxSize: 192, quality: 0.7 });
        return await blobToDataUrl(thumb);
      }
      return url;
    })());
  },

  /**
   * Clear the avatar everywhere: Storage object (when hosted), Firebase Auth and
   * the Firestore user document.
   */
  async removeAvatar(currentAvatarUrl?: string | null): Promise<void> {
    return withLogging(SERVICE_NAME, "removeAvatar", (async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated user");

      await deleteStorageFileByUrl(currentAvatarUrl);
      await updateProfile(firebaseUser, { photoURL: null });
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        { avatar: "", updatedAt: new Date().toISOString() },
        { merge: true }
      );
    })());
  },

  /**
   * Update display name + avatar in Firebase Auth & Firestore.
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return withLogging(SERVICE_NAME, "updateProfile", (async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated user");

      let avatarUrl = data.avatarUrl;

      // 1. Upload new avatar if provided as File
      if (data.avatarFile) {
        avatarUrl = await ProfileService.uploadAvatar(firebaseUser.uid, data.avatarFile);
      }

      // 2. Update Firebase Auth profile. `photoURL` rejects data URLs, so we only
      //    forward real hosted URLs and keep inline avatars in Firestore.
      await updateProfile(firebaseUser, {
        displayName: data.name,
        ...(avatarUrl && !isDataUrl(avatarUrl) ? { photoURL: avatarUrl } : {}),
      });

      // 3. Update Firestore user document
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const firestoreUpdate: Record<string, string> = {
        name: data.name,
        nameAr: data.nameAr,
        updatedAt: new Date().toISOString(),
      };
      if (avatarUrl) firestoreUpdate.avatar = avatarUrl;

      await setDoc(userDocRef, firestoreUpdate, { merge: true });

      // 4. Return updated user shape
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        name: data.name,
        nameAr: data.nameAr,
        avatar: avatarUrl ?? firebaseUser.photoURL ?? "",
        role: "employee",
        companyId: "",
        companyName: "",
      } as User;
    })());
  },
};

