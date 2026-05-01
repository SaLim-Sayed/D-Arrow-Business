import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/auth-context";

interface CompanyContextValue {
  companyId: string | null;
  setCompanyId: (id: string | null) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.companyId) {
      setCompanyId(user.companyId);
    } else if (!isAuthenticated) {
      setCompanyId(null);
    }
    setIsLoading(false);
  }, [user, isAuthenticated]);

  return (
    <CompanyContext.Provider value={{ companyId, setCompanyId, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
