import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { ContractsService } from "../api/contracts.service";
import { notifyDocumentApprovers } from "@/features/notifications/api/document-approval-notifications";
import {
  approvedFields,
  canApproveDocuments,
} from "@/lib/permissions/document-approval";
import type {
  CreateContractDTO,
  SavedContract,
  UpdateContractDTO,
} from "../types/contract.types";

export function useContractsQuery() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.crm.contracts(companyId!),
    queryFn: () => ContractsService.getAll(companyId!),
    enabled: !!companyId,
  });
}

export function useContractQuery(contractId: string | null) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.crm.contract(contractId!),
    queryFn: () => ContractsService.getById(companyId!, contractId!),
    enabled: !!companyId && !!contractId,
  });
}

export function useCreateContractMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateContractDTO, "createdBy">) =>
      ContractsService.create(companyId!, {
        ...data,
        createdBy: user?.id,
        approvalStatus: "pending",
        approvedAt: null,
        approvedBy: null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.contracts(companyId!),
      });
      toast.success(t("contract.saveSuccess"));
      if (companyId && user) {
        void notifyDocumentApprovers({
          companyId,
          senderId: user.id,
          senderName: user.name,
          kind: "contract",
          title: res.data.title,
        });
      }
    },
    onError: () => toast.error(t("contract.saveError")),
  });
}

export function useUpdateContractMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractDTO }) =>
      ContractsService.update(companyId!, id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.contracts(companyId!),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.contract(res.data.id),
      });
      toast.success(t("contract.saveSuccess"));
    },
    onError: () => toast.error(t("contract.saveError")),
  });
}

export function useApproveContractMutation() {
  const { t } = useTranslation("common");
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!canApproveDocuments(user?.role) || !user?.id) {
        throw new Error("Not allowed");
      }
      return ContractsService.update(companyId!, id, approvedFields(user.id));
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.contracts(companyId!),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.contract(res.data.id),
      });
      toast.success(t("documentApproval.approveSuccess"));
    },
    onError: () => toast.error(t("documentApproval.approveError")),
  });
}

export function useDeleteContractMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ContractsService.delete(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.contracts(companyId!),
      });
      toast.success(t("contract.deleteSuccess"));
    },
    onError: () => toast.error(t("contract.deleteError")),
  });
}

export type { SavedContract };
