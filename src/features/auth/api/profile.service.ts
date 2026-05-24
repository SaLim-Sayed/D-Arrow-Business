import { updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { withLogging } from "@/lib/service-utils";
import type { User } from "../types/auth.types";

const SERVICE_NAME = "ProfileService";

export interface UpdateProfileRequest {
  name: string;
  nameAr: string;
  avatarFile?: File | null;
}

export const ProfileService = {
  /**
   * Upload avatar to Firebase Storage and return the download URL.
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    return withLogging(SERVICE_NAME, "uploadAvatar", (async () => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const storageRef = ref(storage, `avatars/${userId}/avatar.${ext}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      return getDownloadURL(storageRef);
    })());
  },

  /**
   * Update display name + avatar in Firebase Auth & Firestore.
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return withLogging(SERVICE_NAME, "updateProfile", (async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated user");

      let avatarUrl: string | undefined;

      // 1. Upload new avatar if provided
      if (data.avatarFile) {
        avatarUrl = await ProfileService.uploadAvatar(firebaseUser.uid, data.avatarFile);
      }

      // 2. Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: data.name,
        ...(avatarUrl ? { photoURL: avatarUrl } : {}),
      });

      // 3. Update Firestore user document
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const firestoreUpdate: Record<string, string> = {
        name: data.name,
        nameAr: data.nameAr,
        updatedAt: new Date().toISOString(),
      };
      if (avatarUrl) firestoreUpdate.avatar = avatarUrl;

      await updateDoc(userDocRef, firestoreUpdate);

      // 4. Return updated user shape (caller merges into store)
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        name: data.name,
        nameAr: data.nameAr,
        avatar: avatarUrl ?? firebaseUser.photoURL ?? `https://avatar.vercel.sh/${firebaseUser.uid}`,
        // These are unchanged — caller should keep existing values
        role: "employee",
        companyId: "",
        companyName: "",
      } as User;
    })());
  },
};
