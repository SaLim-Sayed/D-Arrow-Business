import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bill, CreateBillDTO, UpdateBillDTO } from "../schemas/bill";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { convertTimestampsToDates } from "../utils/timestamp";
import { buildBillJournalEntry } from "../utils/accounting-engine";

async function postBillIfNeeded(
  companyId: string,
  bill: Bill,
  wasDraft: boolean
) {
  if (!wasDraft) return;
  if (bill.status !== "open" && bill.status !== "paid") return;

  const accountsRes = await BillingService.accounts.getAll(companyId);
  const journal = buildBillJournalEntry(bill, accountsRes.data);
  await BillingService.postJournalWithBalances(companyId, journal);
}

export function useBills() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "bills", companyId],
    queryFn: async () => {
      const res = await BillingService.bills.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as Bill[];
      return data.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
    },
    enabled: !!companyId,
  });
}

export function useBill(id?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "bills", companyId, id],
    queryFn: async () => {
      const res = await BillingService.bills.getById(companyId!, id!);
      return convertTimestampsToDates(res.data) as Bill;
    },
    enabled: !!id && !!companyId,
  });
}

export function useCreateBillMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (data: CreateBillDTO) => {
      const isPosting = data.status === "open" || data.status === "paid";
      const payload: CreateBillDTO = {
        ...data,
        status: data.status ?? "draft",
        billNumber: isPosting
          ? data.billNumber || `BILL-${Date.now()}`
          : data.billNumber || "DRAFT",
        amountPaid: data.amountPaid ?? 0,
      };

      const res = await BillingService.bills.create(companyId!, payload);
      const newBill = convertTimestampsToDates(res.data) as Bill;
      await postBillIfNeeded(companyId!, newBill, true);
      return newBill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "bills"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}

export function useUpdateBillMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBillDTO }) => {
      const existingRes = await BillingService.bills.getById(companyId!, id);
      const existing = convertTimestampsToDates(existingRes.data) as Bill;
      const isPosting =
        (data.status === "open" || data.status === "paid") &&
        existing.status === "draft";

      const res = await BillingService.bills.update(companyId!, id, data);
      const updated = convertTimestampsToDates(res.data) as Bill;
      await postBillIfNeeded(companyId!, updated, isPosting);
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["billing", "bills"] });
      queryClient.invalidateQueries({
        queryKey: ["billing", "bills", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
