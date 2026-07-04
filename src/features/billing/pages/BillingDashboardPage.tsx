import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Plus,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { useInvoices } from "../hooks/use-invoices";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { AccountingPageHeader } from "../components/accounting-ui";
import { ZatcaComplianceBanner } from "../components/DaftraWorkflowGuide";
import { useBillingSettings } from "../hooks/use-billing-settings";
import type { Invoice } from "../schemas/invoice";

const STATUS_COLORS: Record<string, string> = {
  paid: "#17c964",
  sent: "#006fee",
  overdue: "#f31260",
  draft: "#a1a1aa",
  cancelled: "#71717a",
};

function invoiceStatusClass(status: Invoice["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "overdue") return "bg-danger/10 text-danger";
  if (status === "sent") return "bg-primary/10 text-primary";
  if (status === "cancelled") return "bg-default-100 text-default-400";
  return "bg-default-100 text-default-500";
}

function buildMonthlyRevenue(invoices: Invoice[], locale: string) {
  const buckets: {
    key: string;
    label: string;
    received: number;
    pending: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();

    buckets.push({
      key: `${year}-${month}`,
      label: date.toLocaleDateString(locale.startsWith("ar") ? "ar-SA" : undefined, {
        month: "short",
      }),
      received: 0,
      pending: 0,
    });
  }

  for (const inv of invoices) {
    const issue = new Date(inv.issueDate);
    const key = `${issue.getFullYear()}-${issue.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) continue;

    bucket.received += inv.amountPaid ?? 0;
    if (inv.status === "sent" || inv.status === "overdue") {
      bucket.pending += getInvoiceAmountDue(inv);
    }
  }

  return buckets.map(({ label, received, pending }) => ({
    name: label,
    received: Math.round(received),
    pending: Math.round(pending),
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
  receivedLabel,
  pendingLabel,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; fill?: string }>;
  label?: string;
  receivedLabel: string;
  pendingLabel: string;
}) {
  if (!active || !payload?.length) return null;

  const nameMap: Record<string, string> = {
    received: receivedLabel,
    pending: pendingLabel,
  };

  return (
    <div className="rounded-lg border border-default-200 bg-content1 px-3 py-2 shadow-md">
      {label && <p className="mb-1.5 text-xs font-semibold text-default-700">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="text-default-500">
            {nameMap[entry.name] ?? entry.name}:
          </span>
          <span className="font-semibold tabular-nums text-default-900" dir="ltr">
            {formatCurrency(entry.value, "USD")}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-default-200 bg-default-50/90 px-4 py-3">
        <h3 className="text-sm font-bold text-default-800">{title}</h3>
        {action}
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}

export default function BillingDashboardPage() {
  const { t, i18n } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [] } = useInvoices();
  const { data: settings } = useBillingSettings();
  const locale = i18n.language;

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + getInvoiceAmountDue(i), 0);

  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + getInvoiceAmountDue(i), 0);

  const totalPaid = invoices.reduce((sum, i) => sum + (i.amountPaid ?? 0), 0);
  const draftsCount = invoices.filter((i) => i.status === "draft").length;

  const invoiceStatusData = useMemo(
    () =>
      (["paid", "sent", "overdue", "draft"] as const)
        .map((status) => ({
          key: status,
          name: t(`invoices.status.${status}`),
          value: invoices.filter((i) => i.status === status).length,
          color: STATUS_COLORS[status],
        }))
        .filter((d) => d.value > 0),
    [invoices, t]
  );

  const revenueData = useMemo(
    () => buildMonthlyRevenue(invoices, locale),
    [invoices, locale]
  );

  const recentInvoices = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
        .slice(0, 5),
    [invoices]
  );

  const dateLocale = locale.startsWith("ar") ? "ar-SA" : undefined;

  const metricCards = [
    {
      key: "outstanding",
      label: t("dashboard.outstanding"),
      value: formatCurrency(totalOutstanding, "USD"),
      icon: TrendingUp,
      className: "text-primary bg-primary/10",
    },
    {
      key: "overdue",
      label: t("dashboard.overdue"),
      value: formatCurrency(totalOverdue, "USD"),
      icon: AlertCircle,
      className: "text-danger bg-danger/10",
    },
    {
      key: "paid",
      label: t("dashboard.total_received"),
      value: formatCurrency(totalPaid, "USD"),
      icon: CheckCircle2,
      className: "text-success bg-success/10",
    },
    {
      key: "drafts",
      label: t("dashboard.drafts"),
      value: String(draftsCount),
      icon: Clock,
      className: "text-default-600 bg-default-100",
      isCount: true,
    },
  ];

  const receivedLabel = t("dashboard.received");
  const pendingLabel = t("dashboard.pending");

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={t("nav.overview")}
        description={t("dashboard.description")}
        breadcrumbItems={[
          { label: t("module_name"), to: "/billing" },
          { label: t("nav.overview") },
        ]}
      />

      <ZatcaComplianceBanner
        taxNumber={settings?.companyProfile?.taxNumber}
        className="mb-5"
      />

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metricCards.map(({ key, label, value, icon: Icon, className, isCount }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-lg border border-default-200 bg-content1 px-3 py-2.5 shadow-sm"
          >
            <div className={cn("rounded-lg p-2", className)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-default-500">{label}</p>
              <p
                className={cn(
                  "truncate text-base font-bold text-default-900",
                  !isCount && "tabular-nums"
                )}
                dir={isCount ? undefined : "ltr"}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard title={t("dashboard.quick_actions")}>
          <div className="flex flex-col gap-2">
            <Button
              color="primary"
              size="sm"
              className="justify-start font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => navigate("/billing/invoices/new")}
            >
              {t("dashboard.create_invoice")}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="justify-start font-medium"
              startContent={<FileSpreadsheet className="h-4 w-4" />}
              onPress={() => navigate("/billing/invoices")}
            >
              {t("dashboard.view_invoices")}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="justify-start font-medium"
              startContent={<ReceiptText className="h-4 w-4" />}
              onPress={() => navigate("/billing/bills")}
            >
              {t("dashboard.manage_bills")}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="justify-start font-medium"
              onPress={() => navigate("/billing/reports")}
            >
              {t("dashboard.view_reports")}
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard title={t("dashboard.status_chart")} className="lg:col-span-2">
          {invoiceStatusData.length > 0 ? (
            <div className="min-h-[240px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {invoiceStatusData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex flex-1 items-center justify-center text-sm text-default-400">
              {t("dashboard.no_data")}
            </p>
          )}
        </DashboardCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title={t("dashboard.revenue_chart")}>
          <div className="min-h-[280px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                  strokeOpacity={0.4}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#71717a" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  width={48}
                />
                <RechartsTooltip
                  content={
                    <ChartTooltip
                      receivedLabel={receivedLabel}
                      pendingLabel={pendingLabel}
                    />
                  }
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Legend
                  iconType="circle"
                  formatter={(value) =>
                    value === "received" ? receivedLabel : pendingLabel
                  }
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Bar
                  dataKey="received"
                  name="received"
                  fill="#17c964"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="pending"
                  name="pending"
                  fill="#006fee"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard
          title={t("dashboard.recent_invoices")}
          action={
            <Button
              size="sm"
              variant="light"
              className="h-7 min-w-0 px-2 text-xs"
              onPress={() => navigate("/billing/invoices")}
            >
              {t("dashboard.view_all")}
            </Button>
          }
        >
          {recentInvoices.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-sm text-default-400">
              {t("dashboard.no_recent")}
            </p>
          ) : (
            <div className="-mx-1 divide-y divide-default-100">
              {recentInvoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => navigate(`/billing/invoices/${inv.id}`)}
                  className="flex w-full items-center justify-between gap-3 px-1 py-2.5 text-start transition-colors hover:bg-primary/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-primary" dir="ltr">
                      {inv.invoiceNumber}
                    </p>
                    <p className="text-xs text-default-500">
                      {inv.issueDate.toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-bold tabular-nums text-default-900" dir="ltr">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </p>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        invoiceStatusClass(inv.status)
                      )}
                    >
                      {t(`invoices.status.${inv.status}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
