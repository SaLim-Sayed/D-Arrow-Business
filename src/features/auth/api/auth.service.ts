import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  getIdToken,
  updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore/lite";
import type { ApiResponse } from "@/types/api.types";
import { withLogging } from "@/lib/service-utils";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types/auth.types";

const SERVICE_NAME = "AuthService";

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
      const idToken = await getIdToken(firebaseUser);
      const refreshToken = firebaseUser.refreshToken;

      // Get additional user data from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      let userData = userDoc.data() as any;

      if (!userDoc.exists()) {
        // Create default user profile in Firestore if it doesn't exist
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
        userData = defaultUserData as User;
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: userData?.name || firebaseUser.displayName || "",
        nameAr: userData?.nameAr || "",
        avatar: userData?.avatar || firebaseUser.photoURL || "",
        role: userData?.role || "employee",
        companyId: userData?.companyId || "default-company",
        companyName: userData?.companyName || "D-Arrow Business",
      };

      return {
        data: {
          user,
          accessToken: idToken,
          refreshToken: refreshToken,
        },
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

      // Update profile with name
      await updateProfile(firebaseUser, {
        displayName: data.name
      });

      const idToken = await getIdToken(firebaseUser);

      const userData: User = {
        id: firebaseUser.uid,
        email: data.email,
        name: data.name,
        nameAr: "",
        avatar: `https://avatar.vercel.sh/${firebaseUser.uid}`,
        role: "admin", // First user is admin
        companyId: data.companyName.toLowerCase().replace(/\s+/g, "-") || "default-company",
        companyName: data.companyName,
      };

      // Create user document in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...userData,
        companyName: data.companyName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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
      
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        nameAr: userData?.nameAr || "",
        avatar: userData?.avatar || firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}`,
        role: userData?.role || "employee",
        companyId: userData?.companyId || "default-company",
      };

      return {
        data: user,
        message: "Success",
      };
    })());
  },

  async logout(): Promise<void> {
    return withLogging(SERVICE_NAME, "logout", signOut(auth));
  }
};
