import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "../types/auth.types";
import * as authApi from "../api/auth.api";
import { setAccessToken } from "@/lib/api-client";
import { STORAGE_KEYS } from "@/lib/constants";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      const { user: userData, accessToken, refreshToken } = response.data;
      setUser(userData);
      setAccessToken(accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    },
    []
  );

  useEffect(() => {
    async function tryRestore() {
      const refreshTokenValue = localStorage.getItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      if (!refreshTokenValue) {
        setIsLoading(false);
        return;
      }

      try {
        const refreshResponse = await authApi.refreshToken(refreshTokenValue);
        setAccessToken(refreshResponse.data.accessToken);
        localStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          refreshResponse.data.refreshToken
        );

        const meResponse = await authApi.getCurrentUser();
        setUser(meResponse.data);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      } finally {
        setIsLoading(false);
      }
    }

    tryRestore();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
