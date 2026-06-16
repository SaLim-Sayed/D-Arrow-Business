import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { useCrmAnalytics } from "../hooks/use-crm-analytics";
import { Target, Users, Handshake, Trophy, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { PrimaryActionButton } from "@/components/shared/primary-action-button";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

const COLORS = ['#006fee', '#17c964', '#f5a524', '#f31260', '#7828c8', '#a1a1aa'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-md border border-default-200 p-3 rounded-xl shadow-lg">
        <p className="font-bold text-sm mb-2">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-default-600 capitalize">{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CrmDashboardPage() {
  const { t } = useTranslation("crm");
  const { kpis, leadsBySource, dealsByStage, revenueByMonth } = useCrmAnalytics();

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

  const leadsSourceData = Object.entries(leadsBySource).map(([key, value], index) => ({
    name: t(`leads.source.${key}`, key),
    value,
    color: COLORS[index % COLORS.length]
  })).filter(d => d.value > 0);

  const dealsStageData = Object.entries(dealsByStage).map(([key, value]) => ({
    name: t(`deals.stage.${key}`, key),
    count: value,
  }));

  const revenueData = Object.entries(revenueByMonth).map(([key, value]) => ({
    name: key,
    amount: value,
  }));

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
            <h3 className="font-bold">{t("dashboard.charts.leadsBySource")} (Pie Chart)</h3>
          </CardHeader>
          <CardBody className="h-[300px]">
            {leadsSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {leadsSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-default-500 flex h-full items-center justify-center">{t("dashboard.charts.noData")}</p>
            )}
          </CardBody>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="pb-0">
            <h3 className="font-bold">{t("dashboard.charts.dealsByStage")} (Bar Chart)</h3>
          </CardHeader>
          <CardBody className="h-[300px]">
            {dealsStageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealsStageData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#17c964" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#17c964" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dx={-10} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
              <p className="text-sm text-default-500 flex h-full items-center justify-center">{t("dashboard.charts.noData")}</p>
             )}
          </CardBody>
        </Card>

        <Card className="glass-card border-none lg:col-span-2">
          <CardHeader className="pb-0">
            <h3 className="font-bold">{t("dashboard.charts.revenueByMonth")} (Line Chart)</h3>
          </CardHeader>
          <CardBody className="h-[300px]">
            {revenueData.length === 0 ? (
              <p className="text-sm text-default-500 flex h-full items-center justify-center">{t("dashboard.charts.noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006fee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#006fee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12, fill: '#71717a' }} dx={-10} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#006fee', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Line type="monotone" dataKey="amount" stroke="#006fee" strokeWidth={4} dot={{ r: 4, fill: '#006fee', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
