import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateAccountDTO, UpdateAccountDTO } from "../schemas/account";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";

// Mock Data for Standard Chart of Accounts Seed
const withAccountDefaults = (
  account: Omit<CreateAccountDTO, "reconcile" | "allowManualEntries" | "deprecated"> &
    Partial<Pick<CreateAccountDTO, "reconcile">>
): CreateAccountDTO => ({
  allowManualEntries: true,
  deprecated: false,
  reconcile: false,
  ...account,
});

const MOCK_ACCOUNTS: CreateAccountDTO[] = [
  withAccountDefaults({ code: "1000", name: "Cash on Hand", type: "asset", subType: "cash", isSystemAccount: true, isActive: true, currentBalance: 5000, currency: "USD", reconcile: true }),
  withAccountDefaults({ code: "1200", name: "Accounts Receivable", type: "asset", subType: "accounts_receivable", isSystemAccount: true, isActive: true, currentBalance: 12000, currency: "USD", reconcile: true }),
  withAccountDefaults({ code: "1500", name: "Inventory Asset", type: "asset", subType: "inventory", isSystemAccount: true, isActive: true, currentBalance: 30000, currency: "USD" }),
  withAccountDefaults({ code: "2000", name: "Accounts Payable", type: "liability", subType: "accounts_payable", isSystemAccount: true, isActive: true, currentBalance: 4500, currency: "USD" }),
  withAccountDefaults({ code: "2100", name: "Tax Payable", type: "liability", subType: "current_liability", isSystemAccount: true, isActive: true, currentBalance: 0, currency: "USD" }),
  withAccountDefaults({ code: "3000", name: "Owner's Equity", type: "equity", subType: "equity", isSystemAccount: true, isActive: true, currentBalance: 42500, currency: "USD" }),
  withAccountDefaults({ code: "4000", name: "Sales Revenue", type: "income", subType: "operating_income", isSystemAccount: true, isActive: true, currentBalance: 0, currency: "USD" }),
  withAccountDefaults({ code: "5000", name: "Cost of Goods Sold", type: "expense", subType: "cost_of_goods_sold", isSystemAccount: true, isActive: true, currentBalance: 0, currency: "USD" }),
  withAccountDefaults({ code: "6000", name: "Bank Fees", type: "expense", subType: "operating_expense", isSystemAccount: false, isActive: true, currentBalance: 0, currency: "USD" }),
];

export function useAccounts() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "accounts", companyId],
    queryFn: async () => {
      const res = await BillingService.accounts.getAll(companyId!);
      
      // Auto-seed if empty for the sake of the demo/migration
      if (res.data.length === 0) {
        console.log("Seeding default chart of accounts...");
        const seedPromises = MOCK_ACCOUNTS.map(acc => 
          BillingService.accounts.create(companyId!, acc)
        );
        const seeded = await Promise.all(seedPromises);
        return seeded.map(s => s.data);
      }
      
      return res.data;
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
