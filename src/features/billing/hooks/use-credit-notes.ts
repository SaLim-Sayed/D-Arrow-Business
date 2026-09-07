import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCreditNoteDTO, UpdateCreditNoteDTO } from "../schemas/credit-note";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";

export function useCreditNotes() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "creditNotes", companyId],
    queryFn: async () => {
      const res = await BillingService.creditNotes.getAll(companyId!);
      return res.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateCreditNoteMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: CreateCreditNoteDTO) => {
      if (!companyId) throw new Error("Company ID is required");
      const res = await BillingService.creditNotes.create(companyId, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "creditNotes", companyId] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals", companyId] });
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices", companyId] });
      queryClient.invalidateQueries({ queryKey: ["billing", "bills", companyId] });
    },
  });
}

export function useUpdateCreditNoteMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCreditNoteDTO }) => {
      if (!companyId) throw new Error("Company ID is required");
      const res = await BillingService.creditNotes.update(companyId, id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "creditNotes", companyId] });
    },
  });
}
