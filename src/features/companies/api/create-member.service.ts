import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  signOut,
  updateProfile,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { withLogging } from "@/lib/service-utils";
import { writeAcceptedInvite } from "@/features/auth/api/auth.service";
import type { User, UserRole } from "@/features/auth/types/auth.types";
import type { CreateInviteInput } from "../types/invite.types";
import { InvitesService } from "./invites.service";

const SERVICE_NAME = "CreateMemberService";
const SECONDARY_APP_NAME = "member-provisioning";
export const MIN_MEMBER_PASSWORD_LENGTH = 8;

/**
 * Creating an account with the client SDK signs the new account in. Doing that
 * on the main app would sign the admin out, so new accounts are created on a
 * second app instance with in-memory persistence; the admin's session is never
 * touched.
 */
function secondaryInstance(): { app: FirebaseApp; auth: Auth } {
  const app =
    getApps().find((a) => a.name === SECONDARY_APP_NAME) ??
    initializeApp(getApp().options, SECONDARY_APP_NAME);
  let auth: Auth;
  try {
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  } catch {
    // Already initialized (e.g. after a hot reload)
    auth = getAuth(app);
  }
  return { app, auth };
}

export interface CreateMemberInput extends CreateInviteInput {
  name: string;
  password: string;
  mustChangePassword: boolean;
}

export const CreateMemberService = {
  /**
   * Admin creates a member account with a password they choose.
   *
   * Built on the invite flow so Firestore rules treat it exactly like an
   * accepted invite: an invite is created (no email sent), then the new
   * account accepts it from the secondary instance.
   */
  async createWithPassword(actorRole: UserRole, input: CreateMemberInput): Promise<User> {
    return withLogging(SERVICE_NAME, "createWithPassword", (async () => {
      if (!input.name.trim()) throw new Error("NAME_REQUIRED");
      if (input.password.length < MIN_MEMBER_PASSWORD_LENGTH) throw new Error("WEAK_PASSWORD");

      const { invite } = await InvitesService.createInvite(actorRole, input, { sendEmail: false });
      const { app, auth } = secondaryInstance();

      try {
        const credential = await createUserWithEmailAndPassword(auth, invite.email, input.password);
        await updateProfile(credential.user, { displayName: input.name.trim() });
        return await writeAcceptedInvite(getFirestore(app), {
          uid: credential.user.uid,
          name: input.name,
          invite,
          mustChangePassword: input.mustChangePassword,
        });
      } catch (err) {
        // Roll back so the email isn't left with a half-made account or a
        // dangling pending invite.
        if (auth.currentUser) await deleteUser(auth.currentUser).catch(() => undefined);
        await InvitesService.revoke(invite.token).catch(() => undefined);
        throw err;
      } finally {
        await signOut(auth).catch(() => undefined);
      }
    })());
  },
};

/** Readable password for the admin to hand over; avoids look-alike characters. */
export function generateMemberPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
