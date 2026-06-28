import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAccounts } from "../hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import {
  buildAgedPayablesReport,
  buildAgedReceivablesReport,
  type AgingBucketKey,
} from "../utils/aged-reports";
import {
  isNonZeroPlAmount,
  plExpenseDisplay,
  plSignedAmount,
  sumPlExpenses,
  sumPlIncome,
} from "../utils/report-utils";
import {
  downloadAgedReportCsv,
  downloadBalanceSheetCsv,
  downloadProfitLossCsv,
  downloadTrialBalanceCsv,
  hasAgedExportData,
  hasBalanceSheetExportData,
  hasProfitLossExportData,
  hasTrialBalanceExportData,
} from "../utils/report-export";
import { ReportsGuide } from "../components/ReportsGuide";
import {
  BalanceSheetColumn,
  NetIncomeBanner,
  ReportDataTable,
  ReportPageHeader,
  ReportSectionIntro,
  ReportShell,
  StatementSection,
  type ReportTabKey,
} from "../components/report-ui";
import type { Account } from "../schemas/account";

function trialBalanceLine(account: Account) {
  const bal = account.currentBalance ?? 0;
  if (account.type === "asset" || account.type === "expense") {
    return { debit: bal > 0 ? bal : 0, credit: bal < 0 ? -bal : 0 };
  }
  return { debit: bal < 0 ? -bal : 0, credit: bal > 0 ? bal : 0 };
}

const BUCKET_KEYS: AgingBucketKey[] = [
  "current",
  "1_30",
  "31_60",
  "61_90",
  "90_plus",
];

function PlAmount({
  amount,
  variant,
}: {
  amount: number;
  variant: "income" | "expense";
}) {
  if (variant === "expense") {
    const { value, isCredit } = plExpenseDisplay(amount);
    return (
      <span
        className={cn(isCredit ? "text-success" : "text-default-900")}
        dir="ltr"
      >
        {isCredit
          ? `(${formatCurrency(value, "USD")})`
          : formatCurrency(value, "USD")}
      </span>
    );
  }
  return (
    <span className="text-default-900" dir="ltr">
      {formatCurrency(amount, "USD")}
    </span>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation("billing");
  const [activeTab, setActiveTab] = useState<ReportTabKey>("pl");
  const { data: accounts = [] } = useAccounts();
  const { data: invoices = [] } = useInvoices();
  const { data: bills = [] } = useBills();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];

  const getPartyName = (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    return contact ? contactDisplayName(contact) : id;
  };

  const agedReceivables = buildAgedReceivablesReport(invoices, getPartyName);
  const agedPayables = buildAgedPayablesReport(bills, getPartyName);

  const trialLines = accounts.map((a) => ({
    account: a,
    ...trialBalanceLine(a),
  }));
  const totalDebits = trialLines.reduce((s, l) => s + l.debit, 0);
  const totalCredits = trialLines.reduce((s, l) => s + l.credit, 0);

  const assets = accounts.filter((a) => a.type === "asset");
  const liabilities = accounts.filter((a) => a.type === "liability");
  const equities = accounts.filter((a) => a.type === "equity");
  const incomes = accounts.filter((a) => a.type === "income");
  const expenses = accounts.filter((a) => a.type === "expense");

  const sumBalances = (accs: typeof accounts) =>
    accs.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalAssets = sumBalances(assets);
  const totalLiabilities = sumBalances(liabilities);
  const totalEquity = sumBalances(equities);
  const totalIncome = sumPlIncome(incomes);
  const totalExpense = sumPlExpenses(expenses);
  const netIncome = totalIncome - totalExpense;

  const incomeLines = incomes.filter((a) => isNonZeroPlAmount(plSignedAmount(a)));
  const expenseLines = expenses.filter((a) => isNonZeroPlAmount(plSignedAmount(a)));
  const hasExpenseCredits = expenseLines.some((a) => plSignedAmount(a) < 0);

  const accountLabel = (a: Account) =>
    t(`accounts.names.${a.name}`, { defaultValue: a.name });

  const agingBucketLabels = {
    current: t("reports.aging_buckets.current"),
    "1_30": t("reports.aging_buckets.1_30"),
    "31_60": t("reports.aging_buckets.31_60"),
    "61_90": t("reports.aging_buckets.61_90"),
    "90_plus": t("reports.aging_buckets.90_plus"),
  };

  const handleExport = () => {
    switch (activeTab) {
      case "pl": {
        const incomeExport = [
          ...incomes.map((a) => ({
            label: accountLabel(a),
            amount: plSignedAmount(a),
          })),
        ];
        const expenseExport = [
          ...expenses.map((a) => ({
            label: accountLabel(a),
            amount: plSignedAmount(a),
          })),
        ];
        if (
          !hasProfitLossExportData({
            incomeRows: incomeExport,
            expenseRows: expenseExport,
            totalIncome,
            totalExpense,
          })
        ) {
          toast.error(t("reports.export_empty"));
          return;
        }
        downloadProfitLossCsv({
          incomeRows: incomeExport.filter((r) => isNonZeroPlAmount(r.amount)),
          expenseRows: expenseExport.filter((r) => isNonZeroPlAmount(r.amount)),
          totalIncome,
          totalExpense,
          netIncome,
          labels: {
            section: t("reports.export_section"),
            income: t("reports.income"),
            expenses: t("reports.expenses"),
            totalIncome: t("reports.total_income"),
            totalExpenses: t("reports.total_expenses"),
            netIncome: t("reports.net_income"),
            amount: t("reports.export_amount"),
          },
        });
        break;
      }
      case "bs": {
        if (!hasBalanceSheetExportData(accounts)) {
          toast.error(t("reports.export_empty"));
          return;
        }
        downloadBalanceSheetCsv({
          assetRows: assets.map((a) => ({
            label: accountLabel(a),
            amount: a.currentBalance ?? 0,
          })),
          liabilityRows: liabilities.map((a) => ({
            label: accountLabel(a),
            amount: a.currentBalance ?? 0,
          })),
          equityRows: [
            ...equities.map((a) => ({
              label: accountLabel(a),
              amount: a.currentBalance ?? 0,
            })),
            { label: t("reports.net_income_current_year"), amount: netIncome },
          ],
          totalAssets,
          totalLiabilities,
          totalEquity: totalEquity + netIncome,
          netIncome,
          liabilitiesPlusEquity: totalLiabilities + totalEquity + netIncome,
          labels: {
            section: t("reports.export_section"),
            assets: t("reports.assets"),
            liabilities: t("reports.liabilities"),
            equity: t("reports.equity"),
            totalAssets: t("reports.total_assets"),
            totalLiabilities: t("reports.total_liabilities"),
            totalEquity: t("reports.total_equity"),
            netIncome: t("reports.net_income_current_year"),
            liabilitiesPlusEquity: t("reports.liabilities_plus_equity"),
            amount: t("reports.export_amount"),
          },
        });
        break;
      }
      case "tb": {
        if (!hasTrialBalanceExportData(accounts)) {
          toast.error(t("reports.export_empty"));
          return;
        }
        downloadTrialBalanceCsv({
          rows: trialLines.map(({ account, debit, credit }) => ({
            code: account.code,
            name: accountLabel(account),
            debit,
            credit,
          })),
          totalDebits,
          totalCredits,
          headers: [
            t("reports.trial_account"),
            t("reports.export_account_name"),
            t("reports.trial_debit"),
            t("reports.trial_credit"),
          ],
          totalLabel: t("reports.trial_total"),
        });
        break;
      }
      case "ar": {
        if (!hasAgedExportData(agedReceivables.rows)) {
          toast.error(t("reports.export_empty"));
          return;
        }
        downloadAgedReportCsv({
          prefix: "aged_receivables",
          partyHeader: t("reports.ar_customer"),
          bucketHeaders: agingBucketLabels,
          bucketKeys: BUCKET_KEYS,
          rows: agedReceivables.rows,
          totals: agedReceivables.totals,
          grandTotal: agedReceivables.grandTotal,
          totalLabel: t("reports.total"),
        });
        break;
      }
      case "ap": {
        if (!hasAgedExportData(agedPayables.rows)) {
          toast.error(t("reports.export_empty"));
          return;
        }
        downloadAgedReportCsv({
          prefix: "aged_payables",
          partyHeader: t("reports.ap_vendor"),
          bucketHeaders: agingBucketLabels,
          bucketKeys: BUCKET_KEYS,
          rows: agedPayables.rows,
          totals: agedPayables.totals,
          grandTotal: agedPayables.grandTotal,
          totalLabel: t("reports.total"),
        });
        break;
      }
    }
    toast.success(t("reports.export_success"));
  };

  const tabIntro = {
    pl: { subtitle: t("reports.current_fiscal_period"), help: t("reports.pl_help") },
    bs: { subtitle: t("reports.as_of_today"), help: t("reports.bs_help") },
    tb: { help: t("reports.tb_help") },
    ar: { help: t("reports.ar_help") },
    ap: { help: t("reports.ap_help") },
  }[activeTab];

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <ReportPageHeader
        title={t("reports.title")}
        description={t("reports.description")}
      />

      <ReportShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExport={handleExport}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netIncome={netIncome}
      >
        <ReportSectionIntro subtitle={tabIntro.subtitle} help={tabIntro.help} />

        {activeTab === "pl" && (
          <div className="space-y-4">
            <StatementSection
              title={t("reports.income")}
              accentClass="text-success"
              accentBgClass="bg-success/[0.06]"
              emptyMessage={t("reports.no_income")}
              emptyAction={
                <Button
                  as={Link}
                  to="/billing/invoices/new"
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus className="h-4 w-4" />}
                >
                  {t("invoices.add")}
                </Button>
              }
              rows={incomeLines.map((a) => ({
                id: a.id!,
                label: accountLabel(a),
                amount: <PlAmount amount={plSignedAmount(a)} variant="income" />,
              }))}
              totalLabel={t("reports.total_income")}
              totalAmount={formatCurrency(totalIncome, "USD")}
              totalAmountClass="text-success"
            />

            <StatementSection
              title={t("reports.expenses")}
              accentClass="text-warning-700 dark:text-warning"
              accentBgClass="bg-warning/[0.06]"
              emptyMessage={t("reports.no_expenses")}
              emptyAction={
                <Button
                  as={Link}
                  to="/billing/bills/new"
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus className="h-4 w-4" />}
                >
                  {t("bills.add")}
                </Button>
              }
              rows={expenseLines.map((a) => ({
                id: a.id!,
                label: accountLabel(a),
                amount: <PlAmount amount={plSignedAmount(a)} variant="expense" />,
              }))}
              totalLabel={t("reports.total_expenses")}
              totalAmount={formatCurrency(totalExpense, "USD")}
              totalAmountClass="text-warning-700 dark:text-warning"
              footer={hasExpenseCredits ? t("reports.expense_credit_hint") : undefined}
            />

            <NetIncomeBanner
              label={t("reports.net_income")}
              amount={formatCurrency(netIncome, "USD")}
              netIncome={netIncome}
              formula={t("reports.guide.formula_pl")}
            />
          </div>
        )}

        {activeTab === "bs" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <BalanceSheetColumn
              title={t("reports.assets")}
              accentClass="text-primary"
              accentBgClass="bg-primary/[0.06]"
              rows={assets.map((a) => ({
                id: a.id!,
                label: accountLabel(a),
                amount: formatCurrency(a.currentBalance, a.currency),
              }))}
              totalLabel={t("reports.total_assets")}
              totalAmount={formatCurrency(totalAssets, "USD")}
              totalClass="text-primary"
            />

            <div className="space-y-4">
              <BalanceSheetColumn
                title={t("reports.liabilities")}
                accentClass="text-danger"
                accentBgClass="bg-danger/[0.06]"
                rows={liabilities.map((a) => ({
                  id: a.id!,
                  label: accountLabel(a),
                  amount: formatCurrency(a.currentBalance, a.currency),
                }))}
                totalLabel={t("reports.total_liabilities")}
                totalAmount={formatCurrency(totalLiabilities, "USD")}
                totalClass="text-danger"
              />

              <StatementSection
                title={t("reports.equity")}
                accentClass="text-secondary"
                accentBgClass="bg-secondary/[0.06]"
                rows={[
                  ...equities.map((a) => ({
                    id: a.id!,
                    label: accountLabel(a),
                    amount: (
                      <span dir="ltr">
                        {formatCurrency(a.currentBalance, a.currency)}
                      </span>
                    ),
                  })),
                  {
                    id: "net-income",
                    label: t("reports.net_income_current_year"),
                    amount: (
                      <span
                        className={netIncome >= 0 ? "text-success" : "text-danger"}
                        dir="ltr"
                      >
                        {formatCurrency(netIncome, "USD")}
                      </span>
                    ),
                  },
                ]}
                totalLabel={t("reports.total_equity")}
                totalAmount={formatCurrency(totalEquity + netIncome, "USD")}
                totalAmountClass="text-secondary"
              />

              <div className="flex items-center justify-between rounded-lg border border-default-200 bg-default-50/60 px-4 py-3 text-sm font-bold">
                <span>{t("reports.liabilities_plus_equity")}</span>
                <span dir="ltr">
                  {formatCurrency(totalLiabilities + totalEquity + netIncome, "USD")}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tb" && (
          <ReportDataTable
            columns={[
              { key: "account", label: t("reports.trial_account") },
              { key: "debit", label: t("reports.trial_debit"), align: "end" },
              { key: "credit", label: t("reports.trial_credit"), align: "end" },
            ]}
            rows={trialLines.map(({ account, debit, credit }) => ({
              id: account.id!,
              cells: [
                <span key="name">
                  <span className="font-mono text-default-500">{account.code}</span>
                  {" — "}
                  {accountLabel(account)}
                </span>,
                debit > 0 ? formatCurrency(debit, account.currency) : "—",
                credit > 0 ? formatCurrency(credit, account.currency) : "—",
              ],
            }))}
            footer={[
              t("reports.trial_total"),
              formatCurrency(totalDebits, "USD"),
              formatCurrency(totalCredits, "USD"),
            ]}
          />
        )}

        {activeTab === "ar" && (
          <ReportDataTable
            emptyMessage={t("reports.no_aged_data")}
            columns={[
              { key: "party", label: t("reports.ar_customer") },
              ...BUCKET_KEYS.map((k) => ({
                key: k,
                label: agingBucketLabels[k],
                align: "end" as const,
              })),
              { key: "total", label: t("reports.total"), align: "end" },
            ]}
            rows={agedReceivables.rows.map((row) => ({
              id: row.partyId,
              cells: [
                <span key="name" className="font-medium">{row.partyName}</span>,
                ...BUCKET_KEYS.map((k) =>
                  row.buckets[k] > 0 ? formatCurrency(row.buckets[k], "USD") : "—"
                ),
                formatCurrency(row.total, "USD"),
              ],
            }))}
            footer={
              agedReceivables.rows.length > 0
                ? [
                    t("reports.total"),
                    ...BUCKET_KEYS.map((k) =>
                      formatCurrency(agedReceivables.totals[k], "USD")
                    ),
                    formatCurrency(agedReceivables.grandTotal, "USD"),
                  ]
                : undefined
            }
          />
        )}

        {activeTab === "ap" && (
          <ReportDataTable
            emptyMessage={t("reports.no_aged_data")}
            columns={[
              { key: "party", label: t("reports.ap_vendor") },
              ...BUCKET_KEYS.map((k) => ({
                key: k,
                label: agingBucketLabels[k],
                align: "end" as const,
              })),
              { key: "total", label: t("reports.total"), align: "end" },
            ]}
            rows={agedPayables.rows.map((row) => ({
              id: row.partyId,
              cells: [
                <span key="name" className="font-medium">{row.partyName}</span>,
                ...BUCKET_KEYS.map((k) =>
                  row.buckets[k] > 0 ? formatCurrency(row.buckets[k], "USD") : "—"
                ),
                formatCurrency(row.total, "USD"),
              ],
            }))}
            footer={
              agedPayables.rows.length > 0
                ? [
                    t("reports.total"),
                    ...BUCKET_KEYS.map((k) =>
                      formatCurrency(agedPayables.totals[k], "USD")
                    ),
                    formatCurrency(agedPayables.grandTotal, "USD"),
                  ]
                : undefined
            }
          />
        )}
      </ReportShell>

      <ReportsGuide activeTab={activeTab} className="mt-6" />
    </div>
  );
}
