import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  getIdToken,
  updateProfile,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, writeBatch, type Firestore } from "firebase/firestore";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types/auth.types";
import { mapFirestoreUser } from "../utils/map-user";
import { InvitesService } from "@/features/companies/api/invites.service";
import type { TeamInvite } from "@/features/companies/types/invite.types";
import { STORAGE_KEYS } from "@/lib/constants";

const SERVICE_NAME = "AuthService";

/**
 * Every new sign-up founds its own company. The id comes from the user's uid,
 * never from the company name, so typing an existing company's name can't land
 * someone inside it. Firestore rules enforce the same thing server-side.
 */
function newCompanyIdFor(uid: string): string {
  return `co-${uid}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

/**
 * Writes the invitee's profile and marks the invite accepted in one batch, as
 * the signed-in invitee. Firestore rules check the profile against the invite
 * (company, role, portal access, email), so both writes must go together.
 * `firestore` is a parameter so admins can run this through a secondary app.
 */
export async function writeAcceptedInvite(
  firestore: Firestore,
  params: {
    uid: string;
    name: string;
    photoURL?: string | null;
    invite: TeamInvite;
    mustChangePassword?: boolean;
  }
): Promise<User> {
  const { uid, name, invite } = params;
  const userData: User = {
    id: uid,
    email: invite.email,
    name: name.trim(),
    nameAr: "",
    avatar: params.photoURL || `https://avatar.vercel.sh/${uid}`,
    role: invite.role,
    companyId: invite.companyId,
    companyName: invite.companyName,
    portalAccess: invite.portalAccess ?? undefined,
    portalSubRoles: invite.portalSubRoles ?? undefined,
  };

  const now = new Date().toISOString();
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, "users", uid), {
    ...userData,
    portalAccess: invite.portalAccess ?? [],
    portalSubRoles: invite.portalSubRoles ?? {},
    inviteToken: invite.token,
    ...(params.mustChangePassword ? { mustChangePassword: true } : {}),
    createdAt: now,
    updatedAt: now,
  });
  batch.update(doc(firestore, "invites", invite.token), {
    status: "accepted",
    acceptedAt: now,
    acceptedBy: uid,
  });
  await batch.commit();
  return userData;
}

/** Throws the same error codes the accept-invite page already understands. */
export function assertInviteUsable(invite: TeamInvite | null): asserts invite is TeamInvite {
  if (!invite) throw new Error("INVITE_NOT_FOUND");
  if (invite.status === "expired" || new Date(invite.expiresAt).getTime() < Date.now()) {
    throw new Error("INVITE_EXPIRED");
  }
  if (invite.status === "revoked") throw new Error("INVITE_REVOKED");
  if (invite.status === "accepted") throw new Error("INVITE_ACCEPTED");
  if (invite.status !== "pending") throw new Error("INVITE_INVALID");
}
const googleProvider = new GoogleAuthProvider();

async function buildLoginResponse(
  firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    refreshToken: string;
    getIdToken: (forceRefresh?: boolean) => Promise<string>;
  },
  userData: Record<string, unknown> | undefined
): Promise<LoginResponse> {
  const idToken = await firebaseUser.getIdToken();
  const user = mapFirestoreUser(firebaseUser.uid, userData, {
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || "",
    avatar: firebaseUser.photoURL || "",
    companyName: "D-Arrow Business",
  });

  return {
    user,
    accessToken: idToken,
    refreshToken: firebaseUser.refreshToken,
  };
}

/**
 * Authentication Service
 * Handles user login, registration, and session management.
 */
export const AuthService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return withLogging(SERVICE_NAME, "login", (async () => {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      const firebaseUser = userCredential.user;

      let userData: Record<string, unknown> | undefined;
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        userData = userDoc.data() as Record<string, unknown> | undefined;

        if (!userDoc.exists()) {
          const defaultUserData: Partial<User> = {
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            nameAr: "",
            avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}`,
            role: "employee",
            companyId: "default-company",
          };
          await setDoc(userDocRef, {
            ...defaultUserData,
            id: firebaseUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          userData = defaultUserData as Record<string, unknown>;
        }
      } catch (err) {
        console.warn("Could not fetch or create user document during login:", err);
      }

      return {
        data: await buildLoginResponse(firebaseUser, userData),
        message: "Login successful",
      };
    })());
  },

  async loginWithGoogle(): Promise<ApiResponse<LoginResponse>> {
    return withLogging(SERVICE_NAME, "loginWithGoogle", (async () => {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      let userData = userDoc.data() as Record<string, unknown> | undefined;

      if (!userDoc.exists()) {
        const displayName =
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "User";
        const companyName = `${displayName}'s Workspace`;
        const companyId = newCompanyIdFor(firebaseUser.uid);

        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: displayName,
          nameAr: "",
          avatar:
            firebaseUser.photoURL ||
            `https://avatar.vercel.sh/${firebaseUser.uid}`,
          role: "admin",
          companyId,
          companyName,
        };

        // Profile and company together: rules only allow founding in one batch.
        const now = new Date().toISOString();
        const batch = writeBatch(db);
        batch.set(userDocRef, { ...newUser, createdAt: now, updatedAt: now });
        batch.set(doc(db, "companies", companyId), {
          name: companyName,
          commercialRegister: "",
          defaultCurrency: "SAR",
          createdAt: now,
          updatedAt: now,
        });
        await batch.commit();

        userData = newUser as unknown as Record<string, unknown>;
      }

      return {
        data: await buildLoginResponse(firebaseUser, userData),
        message: "Login successful",
      };
    })());
  },

  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return withLogging(SERVICE_NAME, "register", (async () => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: data.name
      });

      const idToken = await getIdToken(firebaseUser);

      // Registration always founds a new company. Joining an existing one is
      // only possible through an invite (link, or created by an admin).
      const newCompanyId = newCompanyIdFor(firebaseUser.uid);

      const userData: User = {
        id: firebaseUser.uid,
        email: data.email,
        name: data.name,
        nameAr: "",
        avatar: `https://avatar.vercel.sh/${firebaseUser.uid}`,
        role: "admin",
        companyId: newCompanyId,
        companyName: data.companyName,
      };

      const now = new Date().toISOString();
      const batch = writeBatch(db);
      batch.set(doc(db, "users", firebaseUser.uid), {
        ...userData,
        createdAt: now,
        updatedAt: now,
      });
      batch.set(doc(db, "companies", newCompanyId), {
        name: data.companyName,
        commercialRegister: data.commercialRegister?.trim() || "",
        defaultCurrency: "SAR",
        createdAt: now,
        updatedAt: now,
      });
      await batch.commit();

      return {
        data: {
          user: userData,
          accessToken: idToken,
          refreshToken: firebaseUser.refreshToken,
        },
        message: "Registration successful",
      };
    })());
  },

  async acceptInvite(input: {
    token: string;
    name: string;
    password: string;
  }): Promise<ApiResponse<LoginResponse>> {
    return withLogging(SERVICE_NAME, "acceptInvite", (async () => {
      const invite = await InvitesService.getByToken(input.token);
      assertInviteUsable(invite);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invite.email,
        input.password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: input.name.trim(),
      });

      const userData = await writeAcceptedInvite(db, {
        uid: firebaseUser.uid,
        name: input.name,
        photoURL: firebaseUser.photoURL,
        invite,
      });

      const idToken = await getIdToken(firebaseUser);
      try {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, firebaseUser.refreshToken);
      } catch {
        // ignore
      }

      return {
        data: {
          user: userData,
          accessToken: idToken,
          refreshToken: firebaseUser.refreshToken,
        },
        message: "Invite accepted",
      };
    })());
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return withLogging(SERVICE_NAME, "refreshToken", (async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error("No user logged in");
      }

      const idToken = await getIdToken(firebaseUser, true);
      return {
        data: {
          accessToken: idToken,
          refreshToken: firebaseUser.refreshToken,
        },
        message: "Token refreshed",
      };
    })());
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return withLogging(SERVICE_NAME, "getCurrentUser", (async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error("No user logged in");
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data() as any;
      
      const user = mapFirestoreUser(firebaseUser.uid, userData, {
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}`,
      });

      return {
        data: user,
        message: "Success",
      };
    })());
  },

  async logout(): Promise<void> {
    return withLogging(SERVICE_NAME, "logout", signOut(auth));
  },

  async sendPasswordReset(email: string): Promise<void> {
    return withLogging(
      SERVICE_NAME,
      "sendPasswordReset",
      sendPasswordResetEmail(auth, email)
    );
  },

  async verifyResetCode(oobCode: string): Promise<string> {
    return withLogging(
      SERVICE_NAME,
      "verifyResetCode",
      verifyPasswordResetCode(auth, oobCode)
    );
  },

  async confirmReset(oobCode: string, newPassword: string): Promise<void> {
    return withLogging(
      SERVICE_NAME,
      "confirmReset",
      confirmPasswordReset(auth, oobCode, newPassword)
    );
  },
};
