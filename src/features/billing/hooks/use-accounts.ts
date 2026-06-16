import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Account, CreateAccountDTO, UpdateAccountDTO } from "../schemas/account";

// Mock Data for Standard Chart of Accounts Seed
const MOCK_ACCOUNTS: Account[] = [
  { id: "acc_1000", code: "1000", name: "Cash on Hand", type: "asset", subType: "cash", isSystemAccount: true, isActive: true, currentBalance: 5000, currency: "USD" },
  { id: "acc_1200", code: "1200", name: "Accounts Receivable", type: "asset", subType: "accounts_receivable", isSystemAccount: true, isActive: true, currentBalance: 12000, currency: "USD" },
  { id: "acc_1500", code: "1500", name: "Inventory Asset", type: "asset", subType: "inventory", isSystemAccount: true, isActive: true, currentBalance: 30000, currency: "USD" },
  { id: "acc_2000", code: "2000", name: "Accounts Payable", type: "liability", subType: "accounts_payable", isSystemAccount: true, isActive: true, currentBalance: 4500, currency: "USD" },
  { id: "acc_3000", code: "3000", name: "Owner's Equity", type: "equity", subType: "equity", isSystemAccount: true, isActive: true, currentBalance: 42500, currency: "USD" },
  { id: "acc_4000", code: "4000", name: "Sales Revenue", type: "income", subType: "operating_income", isSystemAccount: true, isActive: true, currentBalance: 0, currency: "USD" },
  { id: "acc_5000", code: "5000", name: "Cost of Goods Sold", type: "expense", subType: "cost_of_goods_sold", isSystemAccount: true, isActive: true, currentBalance: 0, currency: "USD" },
  { id: "acc_6000", code: "6000", name: "Bank Fees", type: "expense", subType: "operating_expense", isSystemAccount: false, isActive: true, currentBalance: 0, currency: "USD" },
];

let accountsCache = [...MOCK_ACCOUNTS];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useAccounts() {
  return useQuery({
    queryKey: ["billing", "accounts"],
    queryFn: async () => {
      await delay(400);
      return [...accountsCache];
    },
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAccountDTO) => {
      await delay(500);
      const newAccount: Account = {
        ...data,
        id: `acc_${Math.random().toString(36).slice(2)}`,
        currentBalance: data.currentBalance ?? 0,
        isSystemAccount: data.isSystemAccount ?? false,
      };
      accountsCache.push(newAccount);
      return newAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountDTO }) => {
      await delay(500);
      const index = accountsCache.findIndex(a => a.id === id);
      if (index === -1) throw new Error("Account not found");
      
      accountsCache[index] = { ...accountsCache[index], ...data };
      return accountsCache[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await delay(500);
      const acc = accountsCache.find(a => a.id === id);
      if (acc?.isSystemAccount) {
        throw new Error("Cannot delete system accounts");
      }
      accountsCache = accountsCache.filter(a => a.id !== id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
