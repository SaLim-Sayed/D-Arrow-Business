import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/auth-context";
import { QUERY_KEYS } from "@/lib/constants";
import { CompanyService } from "../api/company.service";
import { applyCompanyBrandTheme } from "@/theme/apply-brand-theme";

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

  // Shares its cache with useCompanyProfile() (same query key) — this doesn't
  // add an extra fetch beyond whatever the settings page already triggers.
  const { data: profileRes } = useQuery({
    queryKey: QUERY_KEYS.company.profile(companyId ?? ""),
    queryFn: () => CompanyService.getProfile(companyId!),
    enabled: !!companyId,
  });

  useEffect(() => {
    const profile = profileRes?.data;
    applyCompanyBrandTheme(profile?.brandColor, profile?.brandSecondaryColor);
    // Reset to the compiled default palette when there's no active company
    // (e.g. after logout) so a stale override doesn't leak onto the next session.
    return () => {
      if (!companyId) applyCompanyBrandTheme(undefined, undefined);
    };
  }, [profileRes, companyId]);

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
