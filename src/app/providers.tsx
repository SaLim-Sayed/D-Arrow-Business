import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { Toaster } from "sonner";

import { AttendanceInitializer } from "@/features/people/components/AttendanceInitializer";
import { CompanyProvider } from "@/features/companies/context/company-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <AttendanceInitializer />
            {children}
            <Toaster position="bottom-right" />
          </CompanyProvider>
        </AuthProvider>
    </QueryClientProvider>
  );
}
