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
import { useBills } from "../hooks/use-bills";
import { formatCurrency } from "@/lib/utils";

export default function BillsPage() {
  const { t } = useTranslation("billing");
  const { data: bills = [], isLoading } = useBills();
  const [search, setSearch] = useState("");

  const filteredBills = bills.filter((b) =>
    b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("bills.title") || "Bills"}
        description={t("bills.description") || "Manage accounts payable and vendor bills."}
        actions={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
          >
            {t("bills.add") || "New Bill"}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder={t("bills.search") || "Search by bill number..."}
          value={search}
          onValueChange={setSearch}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      <Table aria-label="Bills table" className="mt-4">
        <TableHeader>
          <TableColumn>{t("bills.columns.date")}</TableColumn>
          <TableColumn>{t("bills.columns.bill_number")}</TableColumn>
          <TableColumn>{t("bills.columns.vendor")}</TableColumn>
          <TableColumn>{t("bills.columns.due_date")}</TableColumn>
          <TableColumn>{t("bills.columns.amount")}</TableColumn>
          <TableColumn>{t("bills.columns.status")}</TableColumn>
          <TableColumn align="end">{t("bills.columns.actions")}</TableColumn>
        </TableHeader>
        <TableBody items={filteredBills} isLoading={isLoading}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.issueDate.toLocaleDateString()}</TableCell>
              <TableCell>
                <span className="font-semibold text-danger">{item.billNumber}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-default-700">{item.vendorId}</span>
              </TableCell>
              <TableCell>
                <span className="text-default-500">{item.dueDate.toLocaleDateString()}</span>
              </TableCell>
              <TableCell className="font-bold">
                {formatCurrency(item.grandTotal, item.currency)}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={item.status === "draft" ? "default" : "danger"}>
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
