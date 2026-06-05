import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { PageHeader } from "@/components/shared/page-header";
import { useCrmAnalytics } from "../hooks/use-crm-analytics";
import { useAllUsers } from "@/features/users/hooks/use-users";

export function CrmReportsPage() {
  const { t } = useTranslation("crm");
  const { kpis, leadsBySource, teamPerformance } = useCrmAnalytics();
  const { data: users } = useAllUsers();

  const userName = (id: string) => users?.find((u) => u.id === id)?.name ?? id;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title={t("reports.title")} description={t("reports.description")} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-default-100">
          <CardHeader>
            <h3 className="font-bold">{t("reports.leads.title")}</h3>
          </CardHeader>
          <CardBody className="gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-default-50">
                <p className="text-xs text-default-500">{t("reports.leads.newLeads")}</p>
                <p className="text-2xl font-black">{kpis.totalLeads}</p>
              </div>
              <div className="p-4 rounded-xl bg-default-50">
                <p className="text-xs text-default-500">{t("reports.leads.conversionRate")}</p>
                <p className="text-2xl font-black">{kpis.conversionRate}%</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">{t("reports.leads.sources")}</p>
              <ul className="space-y-1 text-sm">
                {Object.entries(leadsBySource).map(([src, count]) => (
                  <li key={src} className="flex justify-between">
                    <span>{t(`leads.source.${src}`, src)}</span>
                    <span className="font-bold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100">
          <CardHeader>
            <h3 className="font-bold">{t("reports.sales.title")}</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-success/10 text-center">
                <p className="text-xs text-default-500">{t("reports.sales.won")}</p>
                <p className="text-xl font-black text-success">{kpis.wonDeals}</p>
              </div>
              <div className="p-4 rounded-xl bg-danger/10 text-center">
                <p className="text-xs text-default-500">{t("reports.sales.lost")}</p>
                <p className="text-xl font-black text-danger">{kpis.lostDeals}</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 text-center">
                <p className="text-xs text-default-500">{t("reports.sales.revenue")}</p>
                <p className="text-xl font-black text-primary">
                  ${kpis.wonRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100 lg:col-span-2">
          <CardHeader>
            <h3 className="font-bold">{t("reports.team.title")}</h3>
          </CardHeader>
          <CardBody className="overflow-x-auto">
            {Object.keys(teamPerformance).length === 0 ? (
              <p className="text-sm text-default-500">{t("reports.team.empty")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-default-500 border-b border-default-100">
                    <th className="pb-2 font-semibold">{t("reports.team.employee")}</th>
                    <th className="pb-2 font-semibold">{t("reports.team.dealsWon")}</th>
                    <th className="pb-2 font-semibold">{t("reports.team.revenue")}</th>
                    <th className="pb-2 font-semibold">{t("reports.team.tasksDone")}</th>
                    <th className="pb-2 font-semibold">{t("reports.team.conversion")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(teamPerformance).map(([id, p]) => (
                    <tr key={id} className="border-b border-default-50">
                      <td className="py-2 font-medium">{userName(id)}</td>
                      <td className="py-2">{p.dealsWon}</td>
                      <td className="py-2">${p.revenue.toLocaleString()}</td>
                      <td className="py-2">{p.tasksCompleted}</td>
                      <td className="py-2">
                        {p.leadsTotal > 0
                          ? `${Math.round((p.leadsConverted / p.leadsTotal) * 100)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
