import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookA,
  BookCopy,
  Calculator,
  FileSpreadsheet,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  PieChart,
  Plus,
  ReceiptText,
  Settings,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
} from "lucide-react";
import { BillingMoney } from "../components/BillingMoney";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import {
  AccountingAppTile,
  AccountingMetricCards,
  AccountingModuleSection,
  AccountingQuickAction,
} from "../components/accounting-ui";
import {
  DaftraWorkflowGuide,
  ZatcaComplianceBanner,
} from "../components/DaftraWorkflowGuide";

export default function AccountingLandingPage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [] } = useInvoices();
  const { data: bills = [] } = useBills();
  const { data: settings } = useBillingSettings();

  const metrics = useMemo(() => {
    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + getInvoiceAmountDue(i), 0);
    const overdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + getInvoiceAmountDue(i), 0);
    const received = invoices.reduce((sum, i) => sum + (i.amountPaid ?? 0), 0);
    const drafts =
      invoices.filter((i) => i.status === "draft").length +
      bills.filter((b) => b.status === "draft").length;
    return { outstanding, overdue, received, drafts };
  }, [invoices, bills]);

  const openInvoices = invoices.filter(
    (i) => i.status === "sent" || i.status === "overdue" || i.status === "draft"
  ).length;
  const openBills = bills.filter(
    (b) => b.status === "open" || b.status === "overdue" || b.status === "draft"
  ).length;

  const currency = settings?.currencies?.find((c) => c.isDefault)?.code ?? "SAR";

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      {/* Hero — Daftra-style welcome */}
      <div className="mb-5 overflow-hidden rounded-xl border border-default-200 bg-gradient-to-br from-emerald-500/[0.08] via-primary/[0.04] to-content1 p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Calculator className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-default-900 md:text-3xl">
              {t("landing.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-default-600 md:text-base">
              {t("daftra.landing.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions — Daftra prominent CTAs */}
      <div className="mb-5 flex flex-wrap gap-2">
        <AccountingQuickAction
          to="/billing/invoices/new"
          icon={Plus}
          label={t("daftra.quick.new_invoice")}
          color="primary"
        />
        <AccountingQuickAction
          to="/billing/bills/new"
          icon={Plus}
          label={t("daftra.quick.new_bill")}
          color="danger"
        />
        <AccountingQuickAction
          to="/crm/quotations"
          icon={FileText}
          label={t("daftra.quick.quotations")}
          color="default"
        />
        <AccountingQuickAction
          to="/billing/reports"
          icon={PieChart}
          label={t("daftra.quick.reports")}
          color="default"
        />
      </div>

      <ZatcaComplianceBanner taxNumber={settings?.companyProfile?.taxNumber} />

      <AccountingMetricCards
        items={[
          {
            key: "outstanding",
            label: t("dashboard.outstanding"),
            value: <BillingMoney amount={metrics.outstanding} currency={currency} />,
            icon: TrendingUp,
            className: "text-primary bg-primary/10",
            onPress: () => navigate("/billing/invoices"),
          },
          {
            key: "overdue",
            label: t("dashboard.overdue"),
            value: <BillingMoney amount={metrics.overdue} currency={currency} />,
            icon: AlertCircle,
            className: "text-danger bg-danger/10",
            onPress: () => navigate("/billing/invoices"),
          },
          {
            key: "received",
            label: t("dashboard.total_received"),
            value: <BillingMoney amount={metrics.received} currency={currency} />,
            icon: CheckCircle2,
            className: "text-success bg-success/10",
            onPress: () => navigate("/billing/overview"),
          },
          {
            key: "drafts",
            label: t("dashboard.drafts"),
            value: metrics.drafts,
            icon: Clock,
            className: "text-default-600 bg-default-100",
            onPress: () => navigate("/billing/invoices"),
          },
        ]}
      />

      {/* Sales section — Daftra المبيعات */}
      <AccountingModuleSection
        title={t("daftra.sections.sales")}
        description={t("daftra.sections.sales_desc")}
        icon={ShoppingCart}
        iconClassName="bg-primary/10 text-primary"
      >
        <AccountingAppTile
          to="/billing/invoices"
          icon={FileSpreadsheet}
          title={t("landing.apps.invoices.title")}
          description={t("landing.apps.invoices.desc")}
          badge={openInvoices || undefined}
          iconClassName="bg-primary/10 text-primary"
        />
        <AccountingAppTile
          to="/crm/quotations"
          icon={FileText}
          title={t("daftra.apps.quotations.title")}
          description={t("daftra.apps.quotations.desc")}
          iconClassName="bg-sky-500/10 text-sky-600"
        />
        <AccountingAppTile
          to="/billing/products"
          icon={Package}
          title={t("landing.apps.products.title")}
          description={t("landing.apps.products.desc")}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
      </AccountingModuleSection>

      {/* Purchases section — Daftra المشتريات */}
      <AccountingModuleSection
        title={t("daftra.sections.purchases")}
        description={t("daftra.sections.purchases_desc")}
        icon={ReceiptText}
        iconClassName="bg-danger/10 text-danger"
      >
        <AccountingAppTile
          to="/billing/bills"
          icon={ReceiptText}
          title={t("landing.apps.bills.title")}
          description={t("landing.apps.bills.desc")}
          badge={openBills || undefined}
          iconClassName="bg-danger/10 text-danger"
        />
      </AccountingModuleSection>

      {/* Accounting section — Daftra المحاسبة */}
      <AccountingModuleSection
        title={t("daftra.sections.accounting")}
        description={t("daftra.sections.accounting_desc")}
        icon={Wallet}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      >
        <AccountingAppTile
          to="/billing/accounts"
          icon={BookCopy}
          title={t("landing.apps.accounts.title")}
          description={t("landing.apps.accounts.desc")}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <AccountingAppTile
          to="/billing/journals"
          icon={BookA}
          title={t("landing.apps.journals.title")}
          description={t("landing.apps.journals.desc")}
          iconClassName="bg-orange-500/10 text-orange-600"
        />
        <AccountingAppTile
          to="/billing/zakat"
          icon={HandCoins}
          title={t("landing.apps.zakat.title")}
          description={t("landing.apps.zakat.desc")}
          iconClassName="bg-teal-500/10 text-teal-600"
        />
        <AccountingAppTile
          to="/billing/settings"
          icon={Settings}
          title={t("landing.apps.settings.title")}
          description={t("landing.apps.settings.desc")}
          iconClassName="bg-default-200 text-default-600"
        />
      </AccountingModuleSection>

      {/* Reports section */}
      <AccountingModuleSection
        title={t("daftra.sections.reports")}
        description={t("daftra.sections.reports_desc")}
        icon={PieChart}
        iconClassName="bg-violet-500/10 text-violet-600"
      >
        <AccountingAppTile
          to="/billing/reports"
          icon={PieChart}
          title={t("landing.apps.reports.title")}
          description={t("landing.apps.reports.desc")}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <AccountingAppTile
          to="/billing/overview"
          icon={LayoutDashboard}
          title={t("landing.apps.overview.title")}
          description={t("landing.apps.overview.desc")}
          iconClassName="bg-sky-500/10 text-sky-600"
        />
      </AccountingModuleSection>

      <DaftraWorkflowGuide className="mt-2" />

      <p className="mt-6 text-center text-xs text-default-400">{t("landing.footer")}</p>
    </div>
  );
}
