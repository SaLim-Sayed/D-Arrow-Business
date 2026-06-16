import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/utils";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
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
import { useNavigate } from "react-router-dom";
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
import { useInvoices } from "../hooks/use-invoices";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-md border border-default-200 p-3 rounded-xl shadow-lg">
        <p className="font-bold text-sm mb-2">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-default-600 capitalize">{entry.name}:</span>
            <span className="font-bold text-default-900">${entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function BillingDashboardPage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [] } = useInvoices();

  // Invoice Metrics
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);

  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid" || (i.amountPaid && i.amountPaid > 0))
    .reduce((sum, i) => sum + (i.amountPaid || 0), 0);

  const draftsCount = invoices.filter((i) => i.status === "draft").length;

  // Bills Metrics
  // Chart Data
  const invoiceStatusData = [
    {
      name: "Paid",
      value: invoices.filter((i) => i.status === "paid").length,
      color: "#17c964",
    },
    {
      name: "Sent",
      value: invoices.filter((i) => i.status === "sent").length,
      color: "#006fee",
    },
    {
      name: "Overdue",
      value: invoices.filter((i) => i.status === "overdue").length,
      color: "#f31260",
    },
    {
      name: "Draft",
      value: invoices.filter((i) => i.status === "draft").length,
      color: "#a1a1aa",
    },
  ].filter((d) => d.value > 0);

  // Mock revenue data for bar chart
  const revenueData = [
    { name: "Jan", received: 4000, pending: 2400 },
    { name: "Feb", received: 3000, pending: 1398 },
    { name: "Mar", received: 2000, pending: 9800 },
    { name: "Apr", received: 2780, pending: 3908 },
    { name: "May", received: 1890, pending: 4800 },
    {
      name: "Jun",
      received: Math.floor(totalPaid),
      pending: Math.floor(totalOutstanding),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <PageHeader
        title={t("nav.dashboard") || "Billing Dashboard"}
        description={t("dashboard.description") || "Overview of your financial and invoicing status."}
      />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none bg-primary/10 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-primary/20 rounded-2xl text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">
                {t("dashboard.outstanding") || "Outstanding"}
              </p>
              <h4 className="text-3xl font-black text-primary mt-1">
                {formatCurrency(totalOutstanding, "USD")}
              </h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-danger/10 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-danger/20 rounded-2xl text-danger">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">
                {t("dashboard.overdue") || "Overdue"}
              </p>
              <h4 className="text-3xl font-black text-danger mt-1">
                {formatCurrency(totalOverdue, "USD")}
              </h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-success/10 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-success/20 rounded-2xl text-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">
                {t("dashboard.total_received") || "Total Received"}
              </p>
              <h4 className="text-3xl font-black text-success mt-1">
                {formatCurrency(totalPaid, "USD")}
              </h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-default-100 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-default-200 rounded-2xl text-default-600">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">
                {t("dashboard.drafts") || "Drafts"}
              </p>
              <h4 className="text-3xl font-black text-default-900 mt-1">
                {draftsCount}
              </h4>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick Actions */}
        <Card className="shadow-sm border border-default-100 rounded-2xl bg-white dark:bg-content1">
          <CardHeader className="px-6 py-5 border-b border-default-100">
            <h3 className="font-bold text-lg">{t("dashboard.quick_actions") || "Quick Actions"}</h3>
          </CardHeader>
          <CardBody className="p-6 gap-4 flex-col">
            <Button
              color="primary"
              size="lg"
              className="w-full justify-start font-bold"
              startContent={<Plus className="w-5 h-5 mr-2" />}
              onPress={() => navigate("/billing/invoices/new")}
            >
              {t("dashboard.create_invoice") || "Create New Invoice"}
            </Button>
            <Button
              variant="flat"
              size="lg"
              className="w-full justify-start font-bold"
              startContent={<FileSpreadsheet className="w-5 h-5 mr-2" />}
              onPress={() => navigate("/billing/invoices")}
            >
              {t("dashboard.view_invoices") || "View All Invoices"}
            </Button>
            <Button
              variant="flat"
              size="lg"
              className="w-full justify-start font-bold"
              startContent={<ReceiptText className="w-5 h-5 mr-2" />}
              onPress={() => navigate("/billing/bills")}
            >
              {t("dashboard.manage_bills") || "Manage Vendor Bills"}
            </Button>
          </CardBody>
        </Card>

        {/* Status Pie Chart */}
        <Card className="lg:col-span-2 shadow-sm border border-default-100 rounded-2xl bg-white dark:bg-content1">
          <CardHeader className="px-6 py-5 border-b border-default-100">
            <h3 className="font-bold text-lg">{t("dashboard.status_chart") || "Invoices Status (Pie Chart)"}</h3>
          </CardHeader>
          <CardBody className="p-6 h-[300px] flex items-center justify-center">
            {invoiceStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-default-400">
                {t("dashboard.no_data") || "No data available to display chart."}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Revenue Bar Chart */}
        <Card className="shadow-sm border border-default-100 rounded-2xl bg-white dark:bg-content1">
          <CardHeader className="px-6 py-5 border-b border-default-100">
            <h3 className="font-bold text-lg">{t("dashboard.revenue_chart") || "Revenue Overview (Bar Chart)"}</h3>
          </CardHeader>
          <CardBody className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#17c964" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#17c964" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorPen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006fee" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#006fee" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  dx={-10}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                />
                <Bar
                  dataKey="received"
                  name="Received"
                  fill="url(#colorRec)"
                  radius={[6, 6, 0, 0]}
                  barSize={25}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="url(#colorPen)"
                  radius={[6, 6, 0, 0]}
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm border border-default-100 rounded-2xl bg-white dark:bg-content1">
          <CardHeader className="px-6 py-5 border-b border-default-100 flex justify-between">
            <h3 className="font-bold text-lg">{t("dashboard.recent_invoices") || "Recent Invoices"}</h3>
            <Button
              size="sm"
              variant="light"
              onPress={() => navigate("/billing/invoices")}
            >
              {t("dashboard.view_all") || "View All"}
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-default-100">
              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between items-center p-4 hover:bg-default-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/billing/invoices/${inv.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-12 rounded-full ${inv.status === "paid" ? "bg-success" : inv.status === "overdue" ? "bg-danger" : "bg-primary"}`}
                    />
                    <div>
                      <p className="font-bold text-default-900">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-sm text-default-500">
                        {inv.issueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </p>
                    <p className="text-xs uppercase tracking-wider font-bold text-default-400">
                      {inv.status}
                    </p>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="p-8 text-center text-default-500">
                  {t("dashboard.no_recent") || "No recent invoices."}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
