import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { QuotationsService } from "../api/quotations.service";
import type {
  CreateQuotationDTO,
  SavedQuotation,
  UpdateQuotationDTO,
} from "../types/quotation.types";

export function useQuotationsQuery() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.crm.quotations(companyId!),
    queryFn: () => QuotationsService.getAll(companyId!),
    enabled: !!companyId,
  });
}

export function useQuotationQuery(quotationId: string | null) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.crm.quotation(quotationId!),
    queryFn: () => QuotationsService.getById(companyId!, quotationId!),
    enabled: !!companyId && !!quotationId,
  });
}

export function useCreateQuotationMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateQuotationDTO, "createdBy">) =>
      QuotationsService.create(companyId!, {
        ...data,
        createdBy: userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.quotations(companyId!),
      });
      toast.success(t("quotation.saveSuccess"));
    },
    onError: () => toast.error(t("quotation.saveError")),
  });
}

export function useUpdateQuotationMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationDTO }) =>
      QuotationsService.update(companyId!, id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.quotations(companyId!),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.quotation(res.data.id),
      });
      toast.success(t("quotation.saveSuccess"));
    },
    onError: () => toast.error(t("quotation.saveError")),
  });
}

export function useDeleteQuotationMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => QuotationsService.delete(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.quotations(companyId!),
      });
      toast.success(t("quotation.deleteSuccess"));
    },
    onError: () => toast.error(t("quotation.deleteError")),
  });
}

export type { SavedQuotation };
