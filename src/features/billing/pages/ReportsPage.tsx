import {
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { useAccounts } from "../hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const { t } = useTranslation("billing");
  const { data: accounts = [], isLoading } = useAccounts();

  // Basic calculation for Demo
  const assets = accounts.filter(a => a.type === "asset");
  const liabilities = accounts.filter(a => a.type === "liability");
  const equities = accounts.filter(a => a.type === "equity");
  const incomes = accounts.filter(a => a.type === "income");
  const expenses = accounts.filter(a => a.type === "expense");

  const sumBalances = (accs: typeof accounts) => accs.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalAssets = sumBalances(assets);
  const totalLiabilities = sumBalances(liabilities);
  const totalEquity = sumBalances(equities);
  const totalIncome = sumBalances(incomes);
  const totalExpense = sumBalances(expenses);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title={t("reports.title") || "Financial Statements"}
        description={t("reports.description") || "View your real-time financial health, including P&L and Balance Sheet."}
      />

      <Tabs aria-label="Financial Reports">
        <Tab key="pl" title={t("reports.profit_loss") || "Profit & Loss"}>
          <Card className="mt-4">
            <CardHeader className="flex flex-col items-start px-6 pt-6">
              <h3 className="text-xl font-bold">{t("reports.profit_loss") || "Profit and Loss"}</h3>
              <p className="text-sm text-default-500">For the current fiscal period</p>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-6 space-y-6">
              <div>
                <h4 className="text-success font-semibold text-lg border-b pb-2 mb-3">Income</h4>
                {incomes.map(a => (
                  <div key={a.id} className="flex justify-between py-1">
                    <span>{a.name}</span>
                    <span>{formatCurrency(a.currentBalance, a.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total Income</span>
                  <span className="text-success">{formatCurrency(totalIncome, "USD")}</span>
                </div>
              </div>

              <div>
                <h4 className="text-warning font-semibold text-lg border-b pb-2 mb-3">Expenses</h4>
                {expenses.map(a => (
                  <div key={a.id} className="flex justify-between py-1">
                    <span>{a.name}</span>
                    <span>{formatCurrency(a.currentBalance, a.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total Expenses</span>
                  <span className="text-warning">{formatCurrency(totalExpense, "USD")}</span>
                </div>
              </div>

              <div className="flex justify-between font-black text-xl p-4 bg-default-100 rounded-lg">
                <span>Net Income</span>
                <span className={netIncome >= 0 ? "text-success" : "text-danger"}>
                  {formatCurrency(netIncome, "USD")}
                </span>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="bs" title={t("reports.balance_sheet") || "Balance Sheet"}>
          <Card className="mt-4">
            <CardHeader className="flex flex-col items-start px-6 pt-6">
              <h3 className="text-xl font-bold">{t("reports.balance_sheet") || "Balance Sheet"}</h3>
              <p className="text-sm text-default-500">As of today</p>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-6 grid md:grid-cols-2 gap-8">
              {/* Assets */}
              <div>
                <h4 className="text-primary font-semibold text-lg border-b pb-2 mb-3">Assets</h4>
                {assets.map(a => (
                  <div key={a.id} className="flex justify-between py-1">
                    <span>{a.name}</span>
                    <span>{formatCurrency(a.currentBalance, a.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t text-primary">
                  <span>Total Assets</span>
                  <span>{formatCurrency(totalAssets, "USD")}</span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-danger font-semibold text-lg border-b pb-2 mb-3">Liabilities</h4>
                  {liabilities.map(a => (
                    <div key={a.id} className="flex justify-between py-1">
                      <span>{a.name}</span>
                      <span>{formatCurrency(a.currentBalance, a.currency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t text-danger">
                    <span>Total Liabilities</span>
                    <span>{formatCurrency(totalLiabilities, "USD")}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-secondary font-semibold text-lg border-b pb-2 mb-3">Equity</h4>
                  {equities.map(a => (
                    <div key={a.id} className="flex justify-between py-1">
                      <span>{a.name}</span>
                      <span>{formatCurrency(a.currentBalance, a.currency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1">
                    <span>Net Income (Current Year)</span>
                    <span className={netIncome >= 0 ? "text-success" : "text-danger"}>
                      {formatCurrency(netIncome, "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t text-secondary">
                    <span>Total Equity</span>
                    <span>{formatCurrency(totalEquity + netIncome, "USD")}</span>
                  </div>
                </div>
                
                {/* Equation Check */}
                <div className="flex justify-between font-black p-3 bg-default-100 rounded-md">
                  <span>Liabilities + Equity</span>
                  <span>{formatCurrency(totalLiabilities + totalEquity + netIncome, "USD")}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="tb" title={t("reports.trial_balance") || "Trial Balance"}>
           <Card className="mt-4">
            <CardHeader className="flex flex-col items-start px-6 pt-6">
              <h3 className="text-xl font-bold">{t("reports.trial_balance") || "Trial Balance"}</h3>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-6">
               <div className="flex justify-center p-8 text-default-500">
                  Trial balance logic will be fully driven by Journal Entries sum.
               </div>
            </CardBody>
          </Card>
        </Tab>

      </Tabs>
    </div>
  );
}
