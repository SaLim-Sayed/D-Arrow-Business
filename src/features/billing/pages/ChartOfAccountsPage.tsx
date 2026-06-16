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
import { Plus, Search, BookOpen, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { useAccounts } from "../hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

export default function ChartOfAccountsPage() {
  const { t } = useTranslation("billing");
  const { data: accounts = [], isLoading } = useAccounts();
  const [search, setSearch] = useState("");

  const filteredAccounts = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "asset": return "primary";
      case "liability": return "danger";
      case "equity": return "secondary";
      case "income": return "success";
      case "expense": return "warning";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t("accounts.title")}
        description={t("accounts.description")}
        actions={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
          >
            {t("accounts.add")}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input
          placeholder={t("accounts.search")}
          value={search}
          onValueChange={setSearch}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          className="max-w-md"
        />
      </div>

      <Table aria-label={t("accounts.title")} className="mt-4">
        <TableHeader>
          <TableColumn>{t("accounts.columns.code")}</TableColumn>
          <TableColumn>{t("accounts.columns.name")}</TableColumn>
          <TableColumn>{t("accounts.columns.type")}</TableColumn>
          <TableColumn>{t("accounts.columns.balance")}</TableColumn>
          <TableColumn align="end">{t("accounts.columns.actions")}</TableColumn>
        </TableHeader>
        <TableBody items={filteredAccounts} isLoading={isLoading}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <span className="font-mono text-sm font-semibold text-default-600">
                  {item.code}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    {item.isSystemAccount && <Lock className="h-3 w-3 text-default-400" />}
                    {t(`accounts.names.${item.name}`, { defaultValue: item.name })}
                  </span>
                  {item.description && (
                    <span className="text-xs text-default-500">{item.description}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Chip size="sm" variant="flat" color={getTypeColor(item.type) as any}>
                    {t(`accounts.types.${item.type}`)}
                  </Chip>
                  <span className="text-xs text-default-500">
                    {t(`accounts.sub_types.${item.subType}`)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatCurrency(item.currentBalance ?? 0, item.currency ?? "USD")}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                  >
                    <BookOpen className="h-4 w-4" />
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
