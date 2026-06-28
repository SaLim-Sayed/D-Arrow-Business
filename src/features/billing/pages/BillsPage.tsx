import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Spinner,
} from "@heroui/react";
import {
  ChevronRight,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useBills } from "../hooks/use-bills";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import type { Bill } from "../schemas/bill";
import { downloadBillsCsv } from "../utils/bill-export";
import { BillingDocumentGuide } from "../components/BillingDocumentGuide";

type StatusFilter = "all" | Bill["status"];

const STATUS_ORDER: Bill["status"][] = [
  "draft",
  "open",
  "paid",
  "overdue",
  "cancelled",
];

function billStatusColor(status: Bill["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "overdue") return "bg-danger/10 text-danger";
  if (status === "open") return "bg-warning/10 text-warning-700 dark:text-warning";
  if (status === "cancelled") return "bg-default-100 text-default-400";
  return "bg-default-100 text-default-500";
}

function BillRow({
  bill,
  selected,
  onToggle,
  onView,
  vendorName,
  t,
  locale,
}: {
  bill: Bill;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  vendorName: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  locale: string;
}) {
  const dateLocale = locale.startsWith("ar") ? "ar-SA" : undefined;

  return (
    <tr
      className={cn(
        "border-b border-default-100 text-sm transition-colors hover:bg-primary/[0.03]",
        selected && "bg-primary/[0.06]"
      )}
    >
      <td className="w-10 px-3 py-2">
        <Checkbox
          size="sm"
          isSelected={selected}
          onValueChange={onToggle}
          aria-label={bill.billNumber}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-default-600">
        {bill.issueDate.toLocaleDateString(dateLocale)}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <button
          type="button"
          onClick={onView}
          className="font-mono font-semibold text-danger hover:underline"
          dir="ltr"
        >
          {bill.billNumber}
        </button>
      </td>
      <td className="px-3 py-2 font-medium text-default-800">{vendorName}</td>
      <td className="hidden whitespace-nowrap px-3 py-2 text-default-500 md:table-cell">
        {bill.dueDate.toLocaleDateString(dateLocale)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span className="tabular-nums font-medium text-default-900" dir="ltr">
          {formatCurrency(bill.grandTotal, bill.currency)}
        </span>
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
            billStatusColor(bill.status)
          )}
        >
          {t(`bills.status.${bill.status}`)}
        </span>
      </td>
      <td className="w-12 px-2 py-2">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label={t("bills.view")}
          onPress={onView}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export default function BillsPage() {
  const { t, i18n } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: bills = [], isLoading } = useBills();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getVendorName = (vendorId: string) => {
    const contact = contacts.find((c) => c.id === vendorId);
    if (contact) return contactDisplayName(contact);
    if (vendorId.startsWith("vendor_") || vendorId.startsWith("cust_")) {
      return t("bills.unknown_vendor");
    }
    return vendorId;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.billNumber.toLowerCase().includes(q) ||
        getVendorName(b.vendorId).toLowerCase().includes(q)
      );
    });
  }, [bills, search, statusFilter, contacts, t]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((b) => b.id && selectedIds.has(b.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else
      setSelectedIds(new Set(filtered.map((b) => b.id!).filter(Boolean)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0
        ? filtered.filter((b) => b.id && selectedIds.has(b.id))
        : filtered;

    if (toExport.length === 0) {
      toast.error(t("bills.export_empty"));
      return;
    }

    const dateLocale = i18n.language.startsWith("ar") ? "ar-SA" : undefined;

    downloadBillsCsv(
      toExport,
      [
        t("bills.columns.date"),
        t("bills.columns.bill_number"),
        t("bills.columns.vendor"),
        t("bills.columns.due_date"),
        t("bills.columns.amount"),
        t("bills.columns.status"),
      ],
      (b) => [
        b.issueDate.toLocaleDateString(dateLocale),
        b.billNumber,
        getVendorName(b.vendorId),
        b.dueDate.toLocaleDateString(dateLocale),
        b.grandTotal,
        t(`bills.status.${b.status}`),
      ]
    );
    toast.success(t("bills.export_success"));
  };

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("bills.filters.all") },
    ...STATUS_ORDER.map((status) => ({
      key: status as StatusFilter,
      label: t(`bills.status.${status}`),
    })),
  ];

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">{t("bills.title")}</span>
      </nav>

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-default-900">
          {t("bills.title")}
        </h1>
        <p className="mt-1 text-sm text-default-500">{t("bills.description")}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="border-b border-default-200 bg-default-50/90">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Button
              size="sm"
              color="primary"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => navigate("/billing/bills/new")}
            >
              {t("bills.add")}
            </Button>

            <Button
              size="sm"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExport}
            >
              {t("bills.export")}
            </Button>

            <div className="mx-1 hidden h-5 w-px bg-default-200 sm:block" />

            <Input
              size="sm"
              variant="flat"
              className="min-w-[200px] flex-1 max-w-xl"
              placeholder={t("bills.search")}
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              classNames={{
                inputWrapper:
                  "bg-white dark:bg-content1 shadow-none border border-default-200",
              }}
            />

            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  {t("bills.filters.status")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("bills.filters.status")}
                selectedKeys={new Set([statusFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as StatusFilter;
                  if (key) setStatusFilter(key);
                }}
              >
                {statusChips.map(({ key, label }) => (
                  <DropdownItem key={key}>{label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-default-100 px-3 py-1.5">
            {statusChips.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === key
                    ? "bg-primary text-white"
                    : "bg-white text-default-600 hover:bg-default-100 dark:bg-content1"
                )}
              >
                {label}
              </button>
            ))}
            <span className="ms-auto text-xs text-default-400">
              {t("bills.billCount", { count: filtered.length })}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner color="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-default-500">
              {t("bills.empty")}
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-start">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/50 text-xs uppercase tracking-wide text-default-500">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox
                      size="sm"
                      isSelected={allSelected}
                      onValueChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("bills.columns.date")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("bills.columns.bill_number")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("bills.columns.vendor")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                    {t("bills.columns.due_date")}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t("bills.columns.amount")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("bills.columns.status")}
                  </th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <BillRow
                    key={bill.id}
                    bill={bill}
                    selected={!!bill.id && selectedIds.has(bill.id)}
                    onToggle={() => bill.id && toggleOne(bill.id)}
                    onView={() => navigate(`/billing/bills/${bill.id}`)}
                    vendorName={getVendorName(bill.vendorId)}
                    t={t}
                    locale={i18n.language}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-default-200 bg-default-50/50 px-4 py-2 text-xs text-default-500">
          <span>
            {selectedIds.size > 0
              ? t("bills.selectedCount", { count: selectedIds.size })
              : t("bills.billCount", { count: filtered.length })}
          </span>
          <span>1 / 1</span>
        </div>
      </div>

      <BillingDocumentGuide variant="bill" className="mt-4" />
    </div>
  );
}
