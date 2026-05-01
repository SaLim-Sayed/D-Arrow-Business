import { create } from "zustand";
import type { User } from "@/features/auth/types/auth.types";
import { AuthService } from "@/features/auth/api/auth.service";
import { STORAGE_KEYS } from "@/lib/constants";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
  initialize: () => () => void;
}

// const localStorageAdapter = createJSONStorage(() => localStorage);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await AuthService.login({ email, password });
      const { user: userData, refreshToken } = response.data;
      
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AuthService.logout();
    get().clearAuth();
  },

  checkAuth: async () => {
    // Firebase handles this via onAuthStateChanged
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await getIdToken(firebaseUser);
          
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data() as User | undefined;

          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            nameAr: userData?.nameAr || "",
            avatar: userData?.avatar || firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}`,
            role: (userData?.role as any) || "employee",
            companyId: userData?.companyId || "default-company",
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          set({ isLoading: false });
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },
}));
