import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { useCrmAnalytics } from "../hooks/use-crm-analytics";
import { Target, Users, Handshake, Trophy, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { PrimaryActionButton } from "@/components/shared/primary-action-button";

function BarChart({
  data,
  labelKey,
}: {
  data: Record<string, number>;
  labelKey: (key: string) => string;
}) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs font-medium text-default-500 w-24 shrink-0 truncate">
            {labelKey(key)}
          </span>
          <div className="flex-1 h-6 bg-default-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold w-6 text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

function FunnelChart({
  stages,
  labelKey,
}: {
  stages: Record<string, number>;
  labelKey: (key: string) => string;
}) {
  const max = Math.max(...Object.values(stages), 1);
  const order = ["leads", "qualified", "proposal", "negotiation", "won"];
  return (
    <div className="space-y-2">
      {order.map((key) => {
        const value = stages[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs font-medium w-24 shrink-0">{labelKey(key)}</span>
            <div
              className="h-8 bg-primary/80 rounded-lg flex items-center px-3 text-white text-xs font-bold transition-all"
              style={{ width: `${Math.max(20, (value / max) * 100)}%`, minWidth: "4rem" }}
            >
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CrmDashboardPage() {
  const { t } = useTranslation("crm");
  const { kpis, funnel, leadsBySource, dealsByStage, revenueByMonth } = useCrmAnalytics();

  const statCards = [
    { label: t("dashboard.stats.leads"), value: kpis.totalLeads, icon: Target, color: "text-primary", bg: "bg-primary/10", gradient: "from-primary/20 to-orange-500/20" },
    { label: t("dashboard.stats.contacts"), value: kpis.totalContacts, icon: Users, color: "text-success", bg: "bg-success/10", gradient: "from-success/20 to-emerald-500/20" },
    { label: t("dashboard.stats.activeDeals"), value: kpis.activeDeals, icon: Handshake, color: "text-warning", bg: "bg-warning/10", gradient: "from-warning/20 to-amber-500/20" },
    { label: t("dashboard.stats.wonDeals"), value: kpis.wonDeals, icon: Trophy, color: "text-success", bg: "bg-success/10", gradient: "from-emerald-500/20 to-teal-500/20" },
    { label: t("dashboard.stats.lostDeals"), value: kpis.lostDeals, icon: XCircle, color: "text-danger", bg: "bg-danger/10", gradient: "from-danger/20 to-rose-500/20" },
    {
      label: t("dashboard.stats.expectedRevenue"),
      value: `$${kpis.expectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-secondary",
      bg: "bg-secondary/10",
      gradient: "from-secondary/20 to-pink-500/20",
    },
    {
      label: t("dashboard.stats.conversionRate"),
      value: `${kpis.conversionRate}%`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      gradient: "from-primary/20 to-secondary/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        eyebrow={t("nav.dashboard")}
        actions={
          <PrimaryActionButton to="/crm/reports" variant="flat">
            {t("nav.reports")}
          </PrimaryActionButton>
        }
      />

      <StatCardGrid columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </StatCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-none">
          <CardHeader className="pb-0">
            <h3 className="font-bold">{t("dashboard.funnel.title")}</h3>
          </CardHeader>
          <CardBody>
            <FunnelChart stages={funnel} labelKey={(k) => t(`dashboard.funnel.${k}`)} />
          </CardBody>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="pb-0">
            <h3 className="font-bold">{t("dashboard.charts.leadsBySource")}</h3>
          </CardHeader>
          <CardBody>
            <BarChart
              data={leadsBySource}
              labelKey={(k) => t(`leads.source.${k}`, k)}
            />
          </CardBody>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="pb-0">
            <h3 className="font-bold">{t("dashboard.charts.dealsByStage")}</h3>
          </CardHeader>
          <CardBody>
            <BarChart
              data={dealsByStage}
              labelKey={(k) => t(`deals.stage.${k}`, k)}
            />
          </CardBody>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="pb-0">
            <h3 className="font-bold">{t("dashboard.charts.revenueByMonth")}</h3>
          </CardHeader>
          <CardBody>
            {Object.keys(revenueByMonth).length === 0 ? (
              <p className="text-sm text-default-500">{t("dashboard.charts.noData")}</p>
            ) : (
              <BarChart data={revenueByMonth} labelKey={(k) => k} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
