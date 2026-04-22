import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/features/auth/types/auth.types";
import * as authApi from "@/features/auth/api/auth.api";
import { setAccessToken } from "@/lib/api-client";
import { STORAGE_KEYS } from "@/lib/constants";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

// Custom localStorage storage with error handling
const localStorageAdapter = createJSONStorage(() => localStorage);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user: userData, accessToken, refreshToken } = response.data;
          
          // Store tokens in localStorage
          setAccessToken(accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          
          // Update store state
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });

          // Persist to localStorage via zustand persist
          localStorage.setItem(STORAGE_KEYS.AUTH_STORE, JSON.stringify({
            user: userData,
            isAuthenticated: true,
            state: { user: userData, isAuthenticated: true, isLoading: false }
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Clear tokens from localStorage
        setAccessToken(null);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        // Clear store state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Clear persisted state
        localStorage.removeItem(STORAGE_KEYS.AUTH_STORE);
      },

      checkAuth: async () => {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const persistedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_STORE);
        
        // If no refresh token, set as not authenticated
        if (!refreshToken) {
          set({ isLoading: false, user: null, isAuthenticated: false });
          return;
        }

        // First, try to restore from localStorage for instant UI
        let hasRestoredData = false;
        if (persistedAuth) {
          try {
            const parsed = JSON.parse(persistedAuth);
            if (parsed.user && parsed.isAuthenticated) {
              // Set user immediately for better UX
              set({
                user: parsed.user,
                isAuthenticated: true,
                isLoading: true, // Keep loading while we validate
              });
              hasRestoredData = true;
            }
          } catch (error) {
            console.error('Failed to parse persisted auth data:', error);
            // Don't remove immediately, let the refresh attempt handle it
          }
        }

        // If we couldn't restore data, set loading state
        if (!hasRestoredData) {
          set({ isLoading: true });
        }

        // Validate and refresh the session
        try {
          const refreshResponse = await authApi.refreshToken(refreshToken);
          setAccessToken(refreshResponse.data.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshResponse.data.refreshToken);

          const userResponse = await authApi.getCurrentUser();
          const userData = userResponse.data;
          
          // Update with fresh data
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });

          // Update persisted state with fresh data
          localStorage.setItem(STORAGE_KEYS.AUTH_STORE, JSON.stringify({
            user: userData,
            isAuthenticated: true,
            timestamp: Date.now(), // Add timestamp for freshness
          }));
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Only clear if we don't have valid persisted data
          if (!hasRestoredData) {
            get().clearAuth();
          } else {
            // If we have restored data, just clear tokens and keep user data
            setAccessToken(null);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            set({ isLoading: false, isAuthenticated: false });
          }
        }
      },

      clearAuth: () => {
        // Clear all auth-related data
        setAccessToken(null);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_STORE);
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE,
      storage: localStorageAdapter,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
