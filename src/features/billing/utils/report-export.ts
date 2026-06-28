import { escapeCsvCell } from "./account-tree";
import type { AgingBucketKey } from "./aged-reports";
import type { Account } from "../schemas/account";

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const lines = rows.map((row) => row.map(escapeCsvCell).join(","));
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function datedFilename(prefix: string) {
  return `${prefix}_${new Date().toISOString().slice(0, 10)}.csv`;
}

export function downloadProfitLossCsv(input: {
  incomeRows: { label: string; amount: number }[];
  expenseRows: { label: string; amount: number }[];
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  labels: {
    section: string;
    income: string;
    expenses: string;
    totalIncome: string;
    totalExpenses: string;
    netIncome: string;
    amount: string;
  };
}) {
  const rows: (string | number)[][] = [
    [input.labels.section, input.labels.amount],
    [input.labels.income, ""],
    ...input.incomeRows.map((r) => [r.label, r.amount]),
    [input.labels.totalIncome, input.totalIncome],
    [input.labels.expenses, ""],
    ...input.expenseRows.map((r) => [r.label, r.amount]),
    [input.labels.totalExpenses, input.totalExpense],
    [input.labels.netIncome, input.netIncome],
  ];
  downloadCsv(datedFilename("profit_loss"), rows);
}

export function downloadBalanceSheetCsv(input: {
  assetRows: { label: string; amount: number }[];
  liabilityRows: { label: string; amount: number }[];
  equityRows: { label: string; amount: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
  liabilitiesPlusEquity: number;
  labels: {
    section: string;
    assets: string;
    liabilities: string;
    equity: string;
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    netIncome: string;
    liabilitiesPlusEquity: string;
    amount: string;
  };
}) {
  const rows: (string | number)[][] = [
    [input.labels.section, input.labels.amount],
    [input.labels.assets, ""],
    ...input.assetRows.map((r) => [r.label, r.amount]),
    [input.labels.totalAssets, input.totalAssets],
    [input.labels.liabilities, ""],
    ...input.liabilityRows.map((r) => [r.label, r.amount]),
    [input.labels.totalLiabilities, input.totalLiabilities],
    [input.labels.equity, ""],
    ...input.equityRows.map((r) => [r.label, r.amount]),
    [input.labels.netIncome, input.netIncome],
    [input.labels.totalEquity, input.totalEquity],
    [input.labels.liabilitiesPlusEquity, input.liabilitiesPlusEquity],
  ];
  downloadCsv(datedFilename("balance_sheet"), rows);
}

export function downloadTrialBalanceCsv(input: {
  rows: { code: string; name: string; debit: number; credit: number }[];
  totalDebits: number;
  totalCredits: number;
  headers: [string, string, string, string];
  totalLabel: string;
}) {
  const rows: (string | number)[][] = [
    input.headers,
    ...input.rows.map((r) => [r.code, r.name, r.debit || "", r.credit || ""]),
    [input.totalLabel, "", input.totalDebits, input.totalCredits],
  ];
  downloadCsv(datedFilename("trial_balance"), rows);
}

export function downloadAgedReportCsv(input: {
  prefix: "aged_receivables" | "aged_payables";
  partyHeader: string;
  bucketHeaders: Record<AgingBucketKey, string>;
  bucketKeys: AgingBucketKey[];
  rows: {
    partyName: string;
    buckets: Record<AgingBucketKey, number>;
    total: number;
  }[];
  totals: Record<AgingBucketKey, number>;
  grandTotal: number;
  totalLabel: string;
}) {
  const headers = [
    input.partyHeader,
    ...input.bucketKeys.map((k) => input.bucketHeaders[k]),
    input.totalLabel,
  ];
  const dataRows = input.rows.map((row) => [
    row.partyName,
    ...input.bucketKeys.map((k) => row.buckets[k] || ""),
    row.total,
  ]);
  const footer = [
    input.totalLabel,
    ...input.bucketKeys.map((k) => input.totals[k] || ""),
    input.grandTotal,
  ];
  downloadCsv(
    datedFilename(input.prefix),
    [headers, ...dataRows, footer]
  );
}

export function hasTrialBalanceExportData(accounts: Account[]): boolean {
  return accounts.length > 0;
}

export function hasAgedExportData(rows: { total: number }[]): boolean {
  return rows.some((r) => r.total > 0);
}

export function hasProfitLossExportData(input: {
  incomeRows: { amount: number }[];
  expenseRows: { amount: number }[];
  totalIncome: number;
  totalExpense: number;
}): boolean {
  return (
    input.incomeRows.length > 0 ||
    input.expenseRows.length > 0 ||
    Math.abs(input.totalIncome) >= 0.01 ||
    Math.abs(input.totalExpense) >= 0.01
  );
}

export function hasBalanceSheetExportData(accounts: Account[]): boolean {
  return accounts.some((a) => Math.abs(a.currentBalance ?? 0) >= 0.01);
}
