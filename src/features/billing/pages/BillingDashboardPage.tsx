import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
} from "@heroui/react";
import { 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  FileSpreadsheet, 
  ReceiptText 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import { formatCurrency } from "@/lib/utils";

export default function BillingDashboardPage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [] } = useInvoices();
  const { data: bills = [] } = useBills();

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
  const unpaidBills = bills
    .filter((b) => b.status === "draft")
    .reduce((sum, b) => sum + b.grandTotal, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <PageHeader
        title={t("nav.dashboard") || "Billing Dashboard"}
        description="Overview of your financial and invoicing status."
      />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none bg-primary/10 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-primary/20 rounded-2xl text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">Outstanding</p>
              <h4 className="text-3xl font-black text-primary mt-1">{formatCurrency(totalOutstanding, "USD")}</h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-danger/10 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-danger/20 rounded-2xl text-danger">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">Overdue</p>
              <h4 className="text-3xl font-black text-danger mt-1">{formatCurrency(totalOverdue, "USD")}</h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-success/10 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-success/20 rounded-2xl text-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">Total Received</p>
              <h4 className="text-3xl font-black text-success mt-1">{formatCurrency(totalPaid, "USD")}</h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-default-100 shadow-sm hover:scale-[1.02] transition-transform">
          <CardBody className="flex flex-row items-center gap-4 p-6">
            <div className="p-4 bg-default-200 rounded-2xl text-default-600">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-semibold uppercase tracking-wider">Drafts</p>
              <h4 className="text-3xl font-black text-default-900 mt-1">{draftsCount}</h4>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick Actions */}
        <Card className="shadow-sm border border-default-100 rounded-2xl bg-white dark:bg-content1">
          <CardHeader className="px-6 py-5 border-b border-default-100">
            <h3 className="font-bold text-lg">Quick Actions</h3>
          </CardHeader>
          <CardBody className="p-6 gap-4 flex-col">
             <Button
               color="primary"
               size="lg"
               className="w-full justify-start font-bold"
               startContent={<Plus className="w-5 h-5 mr-2" />}
               onPress={() => navigate("/billing/invoices/new")}
             >
               Create New Invoice
             </Button>
             <Button
               variant="flat"
               size="lg"
               className="w-full justify-start font-bold"
               startContent={<FileSpreadsheet className="w-5 h-5 mr-2" />}
               onPress={() => navigate("/billing/invoices")}
             >
               View All Invoices
             </Button>
             <Button
               variant="flat"
               size="lg"
               className="w-full justify-start font-bold"
               startContent={<ReceiptText className="w-5 h-5 mr-2" />}
               onPress={() => navigate("/billing/bills")}
             >
               Manage Vendor Bills
             </Button>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 shadow-sm border border-default-100 rounded-2xl bg-white dark:bg-content1">
          <CardHeader className="px-6 py-5 border-b border-default-100 flex justify-between">
            <h3 className="font-bold text-lg">Recent Invoices</h3>
            <Button size="sm" variant="light" onPress={() => navigate("/billing/invoices")}>
              View All
            </Button>
          </CardHeader>
          <CardBody className="p-0">
             <div className="divide-y divide-default-100">
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-4 hover:bg-default-50 transition-colors cursor-pointer" onClick={() => navigate(`/billing/invoices/${inv.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${inv.status === 'paid' ? 'bg-success' : inv.status === 'overdue' ? 'bg-danger' : 'bg-primary'}`} />
                      <div>
                        <p className="font-bold text-default-900">{inv.invoiceNumber}</p>
                        <p className="text-sm text-default-500">{inv.issueDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-lg">{formatCurrency(inv.grandTotal, inv.currency)}</p>
                       <p className="text-xs uppercase tracking-wider font-bold text-default-400">{inv.status}</p>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="p-8 text-center text-default-500">
                    No recent invoices.
                  </div>
                )}
             </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
