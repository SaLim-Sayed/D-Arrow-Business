import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  Card,
  CardBody,
} from "@heroui/react";
import { Plus, Search, Eye, TrendingUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { useInvoices } from "../hooks/use-invoices";
import { formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices();
  const [search, setSearch] = useState("");

  const filteredInvoices = invoices.filter((i) =>
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  // Dashboard Metrics
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);

  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);

  const draftsCount = invoices.filter((i) => i.status === "draft").length;

  const totalPaid = invoices
    .filter((i) => i.status === "paid" || (i.amountPaid && i.amountPaid > 0))
    .reduce((sum, i) => sum + (i.amountPaid || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("invoices.title") || "Invoices"}
        description={t("invoices.description") || "Manage sales invoices and accounts receivable."}
        actions={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => navigate("/billing/invoices/new")}
          >
            {t("invoices.add") || "New Invoice"}
          </Button>
        }
      />

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none bg-primary/10 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-medium">Outstanding Balance</p>
              <h4 className="text-2xl font-bold text-primary">{formatCurrency(totalOutstanding, "USD")}</h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-danger/10 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-danger/20 rounded-xl text-danger">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-medium">Overdue Amount</p>
              <h4 className="text-2xl font-bold text-danger">{formatCurrency(totalOverdue, "USD")}</h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-success/10 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-success/20 rounded-xl text-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-medium">Total Paid</p>
              <h4 className="text-2xl font-bold text-success">{formatCurrency(totalPaid, "USD")}</h4>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none bg-default-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-default-200 rounded-xl text-default-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-default-500 text-sm font-medium">Draft Invoices</p>
              <h4 className="text-2xl font-bold text-default-900">{draftsCount}</h4>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder={t("invoices.search") || "Search by invoice number..."}
          value={search}
          onValueChange={setSearch}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      <Table aria-label="Invoices table" className="mt-4">
        <TableHeader>
          <TableColumn>DATE</TableColumn>
          <TableColumn>INVOICE#</TableColumn>
          <TableColumn>CUSTOMER</TableColumn>
          <TableColumn>DUE DATE</TableColumn>
          <TableColumn>AMOUNT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody items={filteredInvoices} isLoading={isLoading}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.issueDate.toLocaleDateString()}</TableCell>
              <TableCell>
                <span className="font-semibold text-primary">{item.invoiceNumber}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-default-700">{item.customerId}</span>
              </TableCell>
              <TableCell>
                <span className="text-default-500">{item.dueDate.toLocaleDateString()}</span>
              </TableCell>
              <TableCell className="font-bold">
                {formatCurrency(item.grandTotal, item.currency)}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={item.status === "draft" ? "default" : "success"}>
                  {item.status.toUpperCase()}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => navigate(`/billing/invoices/${item.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
