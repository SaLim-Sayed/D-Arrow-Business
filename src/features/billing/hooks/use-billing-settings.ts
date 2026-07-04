import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BillingSettings } from "../schemas/settings";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { ensureProductCatalogDefaults } from "../utils/ensure-product-catalog";

export function useBillingSettings() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "settings", companyId],
    queryFn: async () => {
      await ensureProductCatalogDefaults(companyId!);
      const res = await BillingService.settings.get(companyId!);
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useUpdateBillingSettingsMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: Partial<BillingSettings>) => {
      if (!companyId) {
        throw new Error("Company not selected");
      }
      const res = await BillingService.settings.update(companyId, data);
      return res.data;
    },
    onSuccess: (saved) => {
      if (companyId) {
        queryClient.setQueryData(["billing", "settings", companyId], saved);
      }
      queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
    },
  });
}
