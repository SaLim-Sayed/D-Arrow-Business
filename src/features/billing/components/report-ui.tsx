import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import {
  ArrowLeftRight,
  BarChart3,
  ChevronRight,
  Download,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatCurrency } from "@/lib/utils";

export type ReportTabKey = "pl" | "bs" | "tb" | "ar" | "ap";

const TAB_CONFIG: {
  key: ReportTabKey;
  icon: React.ElementType;
  labelKey: string;
}[] = [
  { key: "pl", icon: BarChart3, labelKey: "reports.profit_loss" },
  { key: "bs", icon: Scale, labelKey: "reports.balance_sheet" },
  { key: "tb", icon: ArrowLeftRight, labelKey: "reports.trial_balance" },
  { key: "ar", icon: Users, labelKey: "reports.aged_receivables" },
  { key: "ap", icon: Wallet, labelKey: "reports.aged_payables" },
];

export function ReportPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation("billing");

  return (
    <>
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">{title}</span>
      </nav>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-default-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-default-500">{description}</p>
      </div>
    </>
  );
}

export function ReportTabBar({
  activeTab,
  onChange,
  onExport,
}: {
  activeTab: ReportTabKey;
  onChange: (tab: ReportTabKey) => void;
  onExport?: () => void;
}) {
  const { t } = useTranslation("billing");

  return (
    <div className="border-b border-default-200 bg-default-50/90">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TAB_CONFIG.map(({ key, icon: Icon, labelKey }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-content1 text-default-600 hover:bg-default-100 dark:bg-content1"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
        {onExport && (
          <Button
            size="sm"
            variant="flat"
            className="shrink-0 font-medium"
            startContent={<Download className="h-4 w-4" />}
            onPress={onExport}
          >
            {t("reports.export")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ReportPlMetrics({
  totalIncome,
  totalExpense,
  netIncome,
}: {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
}) {
  const { t } = useTranslation("billing");

  const items = [
    {
      key: "income",
      label: t("reports.total_income"),
      value: formatCurrency(totalIncome, "USD"),
      icon: TrendingUp,
      iconClass: "text-success bg-success/10",
    },
    {
      key: "expense",
      label: t("reports.total_expenses"),
      value: formatCurrency(totalExpense, "USD"),
      icon: TrendingDown,
      iconClass: "text-warning-700 bg-warning/10 dark:text-warning",
    },
    {
      key: "net",
      label: t("reports.net_income"),
      value: formatCurrency(netIncome, "USD"),
      icon: BarChart3,
      iconClass:
        netIncome >= 0
          ? "text-success bg-success/10"
          : "text-danger bg-danger/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-default-200 bg-content1 px-3 py-3 sm:grid-cols-3">
      {items.map(({ key, label, value, icon: Icon, iconClass }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-lg border border-default-200 bg-default-50/50 px-3 py-2.5 dark:bg-default-50/5"
        >
          <div className={cn("rounded-lg p-2", iconClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-default-500">{label}</p>
            <p className="truncate text-base font-bold tabular-nums text-default-900" dir="ltr">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportShell({
  activeTab,
  onTabChange,
  onExport,
  totalIncome,
  totalExpense,
  netIncome,
  children,
}: {
  activeTab: ReportTabKey;
  onTabChange: (tab: ReportTabKey) => void;
  onExport?: () => void;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
      <ReportTabBar activeTab={activeTab} onChange={onTabChange} onExport={onExport} />
      {activeTab === "pl" && (
        <ReportPlMetrics
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netIncome={netIncome}
        />
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

export function ReportSectionIntro({
  subtitle,
  help,
}: {
  subtitle?: string;
  help?: string;
}) {
  if (!subtitle && !help) return null;

  return (
    <div className="mb-4 space-y-2">
      {subtitle && (
        <p className="text-xs font-medium uppercase tracking-wide text-default-400">
          {subtitle}
        </p>
      )}
      {help && (
        <p className="rounded-md border border-default-200 bg-default-50/60 px-3 py-2 text-xs leading-relaxed text-default-500 dark:bg-default-50/5">
          {help}
        </p>
      )}
    </div>
  );
}

export function StatementSection({
  title,
  accentClass,
  accentBgClass,
  emptyMessage,
  emptyAction,
  rows,
  totalLabel,
  totalAmount,
  totalAmountClass,
  footer,
}: {
  title: string;
  accentClass: string;
  accentBgClass?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  rows: { id: string; label: string; amount: React.ReactNode }[];
  totalLabel: string;
  totalAmount: React.ReactNode;
  totalAmountClass?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-default-200">
      <div
        className={cn(
          "border-b border-default-200 px-4 py-2.5 text-sm font-bold",
          accentBgClass ?? "bg-default-50/80",
          accentClass
        )}
      >
        {title}
      </div>
      <div className="divide-y divide-default-100 bg-content1">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-default-400">{emptyMessage}</p>
            {emptyAction && <div className="mt-3">{emptyAction}</div>}
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-primary/[0.02]"
            >
              <span className="text-default-700">{row.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-default-900">
                {row.amount}
              </span>
            </div>
          ))
        )}
        <div className="flex items-center justify-between gap-4 bg-default-50/70 px-4 py-3 text-sm font-bold">
          <span className="text-default-800">{totalLabel}</span>
          <span className={cn("shrink-0 tabular-nums", totalAmountClass)} dir="ltr">
            {totalAmount}
          </span>
        </div>
      </div>
      {footer && (
        <div className="border-t border-default-100 bg-default-50/40 px-4 py-2 text-xs text-default-400">
          {footer}
        </div>
      )}
    </div>
  );
}

export function NetIncomeBanner({
  label,
  amount,
  netIncome,
  formula,
}: {
  label: string;
  amount: string;
  netIncome: number;
  formula: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-lg border-2",
        netIncome >= 0 ? "border-success/30 bg-success/[0.04]" : "border-danger/30 bg-danger/[0.04]"
      )}
    >
      <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base font-bold text-default-800">{label}</span>
        <span
          className={cn(
            "text-2xl font-black tabular-nums",
            netIncome >= 0 ? "text-success" : "text-danger"
          )}
          dir="ltr"
        >
          {amount}
        </span>
      </div>
      <div className="border-t border-default-200/80 bg-content1/80 px-4 py-2 text-center text-xs text-default-400">
        {formula}
      </div>
    </div>
  );
}

export function ReportDataTable({
  columns,
  rows,
  footer,
  emptyMessage,
}: {
  columns: { key: string; label: string; align?: "start" | "end" }[];
  rows: { id: string; cells: React.ReactNode[] }[];
  footer?: React.ReactNode[];
  emptyMessage?: string;
}) {
  if (rows.length === 0 && emptyMessage) {
    return (
      <div className="rounded-lg border border-dashed border-default-300 bg-default-50/40 py-12 text-center text-sm text-default-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-default-200 bg-content1">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-default-200 bg-default-50/90 text-xs uppercase tracking-wide text-default-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 font-semibold",
                    col.align === "end" ? "text-end" : "text-start"
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-default-100 transition-colors hover:bg-primary/[0.02]"
              >
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-4 py-2.5",
                      columns[i]?.align === "end" ? "text-end tabular-nums" : "text-start"
                    )}
                    dir={columns[i]?.align === "end" ? "ltr" : undefined}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t-2 border-default-200 bg-default-50/80 font-bold">
                {footer.map((cell, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-4 py-3",
                      columns[i]?.align === "end" ? "text-end tabular-nums" : "text-start"
                    )}
                    dir={columns[i]?.align === "end" ? "ltr" : undefined}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export function BalanceSheetColumn({
  title,
  accentClass,
  accentBgClass,
  rows,
  totalLabel,
  totalAmount,
  totalClass,
}: {
  title: string;
  accentClass: string;
  accentBgClass?: string;
  rows: { id: string; label: string; amount: string }[];
  totalLabel: string;
  totalAmount: string;
  totalClass?: string;
}) {
  return (
    <StatementSection
      title={title}
      accentClass={accentClass}
      accentBgClass={accentBgClass}
      rows={rows.map((r) => ({
        id: r.id,
        label: r.label,
        amount: <span dir="ltr">{r.amount}</span>,
      }))}
      totalLabel={totalLabel}
      totalAmount={totalAmount}
      totalAmountClass={totalClass}
    />
  );
}
