import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" />
        </AuthProvider>
    </QueryClientProvider>
  );
}
