import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_CHART_OF_ACCOUNTS,
  type CreateAccountDTO,
  type UpdateAccountDTO,
} from "../schemas/account";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";

export function useAccounts() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "accounts", companyId],
    queryFn: async () => {
      const res = await BillingService.accounts.getAll(companyId!);
      
      // Add only missing standard accounts. Existing balances, names, and
      // company-specific accounts remain untouched.
      const existingCodes = new Set(res.data.map((account) => account.code));
      const missingAccounts = DEFAULT_CHART_OF_ACCOUNTS.filter(
        (account) => !existingCodes.has(account.code)
      );

      if (missingAccounts.length === 0) return res.data;

      const seeded = await Promise.all(
        missingAccounts.map((account) =>
          BillingService.accounts.create(companyId!, { ...account, isActive: true })
        )
      );

      return [...res.data, ...seeded.map((result) => result.data)];
    },
    enabled: !!companyId,
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  
  return useMutation({
    mutationFn: async (data: CreateAccountDTO) => {
      const payload = {
        ...data,
        currentBalance: data.currentBalance ?? 0,
        isSystemAccount: data.isSystemAccount ?? false,
      };
      const res = await BillingService.accounts.create(companyId!, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountDTO }) => {
      const res = await BillingService.accounts.update(companyId!, id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (id: string) => {
      // Note: We should ideally fetch to check if isSystemAccount before delete,
      // but UI handles disabling the delete button for system accounts.
      await BillingService.accounts.delete(companyId!, id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
