import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "../context/company-context";
import { PricingService } from "../api/pricing.service";
import type {
  CreateProductPriceDTO,
  UpdateProductPriceDTO,
} from "../types/pricing.types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function usePricingList() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.company.prices(companyId!),
    queryFn: () => PricingService.getAll(companyId!),
    enabled: !!companyId,
    select: (res) => res.data,
  });
}

export function useCreatePriceMutation() {
  const { t } = useTranslation("settings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductPriceDTO) =>
      PricingService.create(companyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.company.prices(companyId!),
      });
      toast.success(t("pricing.saveSuccess"));
    },
    onError: () => toast.error(t("pricing.saveError")),
  });
}

export function useUpdatePriceMutation() {
  const { t } = useTranslation("settings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductPriceDTO }) =>
      PricingService.update(companyId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.company.prices(companyId!),
      });
      toast.success(t("pricing.saveSuccess"));
    },
    onError: () => toast.error(t("pricing.saveError")),
  });
}

export function useDeletePriceMutation() {
  const { t } = useTranslation("settings");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => PricingService.delete(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.company.prices(companyId!),
      });
      toast.success(t("pricing.deleteSuccess"));
    },
    onError: () => toast.error(t("pricing.deleteError")),
  });
}
