import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "../types/auth.types";
import { useAuthStore } from "@/stores/auth.store";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only check auth on initial mount
    const hasCheckedAuth = sessionStorage.getItem('auth-checked');
    if (!hasCheckedAuth) {
      checkAuth();
      sessionStorage.setItem('auth-checked', 'true');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
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
