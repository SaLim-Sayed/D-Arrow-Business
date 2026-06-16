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
} from "@heroui/react";
import { Plus, Search, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { useInvoices } from "../hooks/use-invoices";
import { formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const { t } = useTranslation("billing");
  const { data: invoices = [], isLoading } = useInvoices();
  const [search, setSearch] = useState("");

  const filteredInvoices = invoices.filter((i) =>
    i.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("invoices.title") || "Invoices"}
        description={t("invoices.description") || "Manage sales invoices and accounts receivable."}
        actions={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
          >
            {t("invoices.add") || "New Invoice"}
          </Button>
        }
      />

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
                  <Button isIconOnly size="sm" variant="light">
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
