import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "../context/company-context";
import { CompanyService } from "../api/company.service";
import type { UpdateCompanyProfileDTO } from "../types/company.types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useCompanyProfile() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.company.profile(companyId!),
    queryFn: () => CompanyService.getProfile(companyId!),
    enabled: !!companyId,
    select: (res) => res.data,
  });
}

export function useUpdateCompanyProfileMutation() {
  const { t } = useTranslation("settings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyProfileDTO) =>
      CompanyService.updateProfile(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.company.profile(companyId!),
      });
      toast.success(t("company.saveSuccess"));
    },
    onError: () => toast.error(t("company.saveError")),
  });
}
