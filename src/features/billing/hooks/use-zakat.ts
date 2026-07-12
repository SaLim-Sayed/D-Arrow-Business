import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateZakatRecordDTO } from "../schemas/zakat";
import { BillingService } from "../api/billing.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useAccounts } from "./use-accounts";
import { useBillingSettings } from "./use-billing-settings";
import { convertTimestampsToDates } from "../utils/timestamp";
import { computeZakatBase } from "../utils/zakat-utils";
import { getDefaultBillingCurrency } from "../utils/billing-currency";
import { DEFAULT_CHART_OF_ACCOUNTS, type Account, type AccountSubType } from "../schemas/account";
import type { ZakatRecord } from "../schemas/zakat";

function findAccount(accounts: Account[], subType: AccountSubType) {
  return accounts.find((a) => a.subType === subType && !a.deprecated);
}

// Companies whose chart of accounts was seeded before the Zakat module existed
// won't have these accounts yet — create them on first use instead of failing.
async function ensureZakatAccount(
  companyId: string,
  accounts: Account[],
  subType: AccountSubType
): Promise<Account> {
  const existing = findAccount(accounts, subType);
  if (existing) return existing;

  const template = DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.subType === subType);
  if (!template) throw new Error(`No default account template for subtype ${subType}`);

  const res = await BillingService.accounts.create(companyId, { ...template, isActive: true });
  return res.data;
}

export function useZakatRecords() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["billing", "zakatRecords", companyId],
    queryFn: async () => {
      const res = await BillingService.zakatRecords.getAll(companyId!);
      const data = convertTimestampsToDates(res.data) as ZakatRecord[];
      return data.sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime());
    },
    enabled: !!companyId,
  });
}

// Configured rate comes from Billing Settings (percentage, e.g. 2.5) — not hardcoded.
export function useZakatCalculation(rateOverride?: number) {
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useBillingSettings();
  const configuredRate = (settings?.zakatRate ?? 2.5) / 100;
  const rate = rateOverride !== undefined ? rateOverride / 100 : configuredRate;
  return { ...computeZakatBase(accounts, rate), configuredRatePercent: settings?.zakatRate ?? 2.5 };
}

export function useZakatCurrency() {
  const { data: settings } = useBillingSettings();
  return getDefaultBillingCurrency(settings);
}

export function useAccrueZakatMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (input: {
      fiscalYear: string;
      periodEnd: Date;
      notes?: string;
    } & Pick<
      ReturnType<typeof computeZakatBase>,
      "eligibleAssets" | "currentLiabilities" | "zakatBase" | "rate" | "zakatDue"
    >) => {
      const [accountsRes, settingsRes] = await Promise.all([
        BillingService.accounts.getAll(companyId!),
        BillingService.settings.get(companyId!),
      ]);
      const currency = getDefaultBillingCurrency(settingsRes.data);
      const zakatExpenseAccount = await ensureZakatAccount(companyId!, accountsRes.data, "zakat_expense");
      const zakatPayableAccount = await ensureZakatAccount(companyId!, accountsRes.data, "zakat_payable");
      if (!zakatExpenseAccount.id || !zakatPayableAccount.id) {
        throw new Error("Zakat Expense and Zakat Payable accounts must exist in the chart of accounts");
      }

      const documentNumber = await BillingService.reserveDocumentNumber(companyId!, "zakat");

      const journal = await BillingService.postJournalWithBalances(companyId!, {
        journalNumber: documentNumber,
        date: input.periodEnd,
        reference: input.fiscalYear,
        notes: input.notes ?? `Zakat accrual for ${input.fiscalYear}`,
        currency,
        status: "posted",
        sourceType: "manual",
        lines: [
          {
            accountId: zakatExpenseAccount.id,
            debit: input.zakatDue,
            credit: 0,
            description: `Zakat due for ${input.fiscalYear}`,
            taxAmount: 0,
          },
          {
            accountId: zakatPayableAccount.id,
            debit: 0,
            credit: input.zakatDue,
            description: `Zakat due for ${input.fiscalYear}`,
            taxAmount: 0,
          },
        ],
        totalDebit: input.zakatDue,
        totalCredit: input.zakatDue,
      });

      const record: CreateZakatRecordDTO = {
        fiscalYear: input.fiscalYear,
        periodEnd: input.periodEnd,
        eligibleAssets: input.eligibleAssets,
        currentLiabilities: input.currentLiabilities,
        zakatBase: input.zakatBase,
        rate: input.rate,
        zakatDue: input.zakatDue,
        currency,
        status: "accrued",
        accrualJournalId: journal.id,
        accruedAt: new Date(),
        notes: input.notes,
      };

      const res = await BillingService.zakatRecords.create(companyId!, record);
      return convertTimestampsToDates(res.data) as ZakatRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "zakatRecords"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "settings"] });
    },
  });
}

export function useRecordZakatPaymentMutation() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (input: { record: ZakatRecord; bankAccountId: string; date: Date }) => {
      const accountsRes = await BillingService.accounts.getAll(companyId!);
      const zakatPayableAccount = await ensureZakatAccount(companyId!, accountsRes.data, "zakat_payable");
      if (!zakatPayableAccount.id) {
        throw new Error("Zakat Payable account must exist in the chart of accounts");
      }

      const paymentNumber = await BillingService.reserveDocumentNumber(companyId!, "zakat");

      const journal = await BillingService.postJournalWithBalances(companyId!, {
        journalNumber: paymentNumber,
        date: input.date,
        reference: input.record.fiscalYear,
        notes: `Zakat payment for ${input.record.fiscalYear}`,
        currency: input.record.currency,
        status: "posted",
        sourceType: "manual",
        lines: [
          {
            accountId: zakatPayableAccount.id,
            debit: input.record.zakatDue,
            credit: 0,
            description: `Zakat payment for ${input.record.fiscalYear}`,
            taxAmount: 0,
          },
          {
            accountId: input.bankAccountId,
            debit: 0,
            credit: input.record.zakatDue,
            description: `Zakat payment for ${input.record.fiscalYear}`,
            taxAmount: 0,
          },
        ],
        totalDebit: input.record.zakatDue,
        totalCredit: input.record.zakatDue,
      });

      const res = await BillingService.zakatRecords.update(companyId!, input.record.id!, {
        status: "paid",
        paymentJournalId: journal.id,
        paidAt: new Date(),
      });
      return convertTimestampsToDates(res.data) as ZakatRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "zakatRecords"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "journals"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "accounts"] });
    },
  });
}
