import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useBills } from "../hooks/use-bills";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import type { Bill } from "../schemas/bill";
import { downloadBillsCsv } from "../utils/bill-export";
import { getBillAmountDue } from "../utils/aged-reports";
import { billingDateLocale } from "../utils/locale";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { BillingDocumentGuide } from "../components/BillingDocumentGuide";
import {
  AccountingListShell,
  AccountingMetricCards,
  AccountingPageHeader,
  billStatusClass,
  ContactAvatar,
  StatusFilterChips,
} from "../components/accounting-ui";

type StatusFilter = "all" | Bill["status"];

const STATUS_ORDER: Bill["status"][] = [
  "draft",
  "open",
  "paid",
  "overdue",
  "cancelled",
];


function BillRow({
  bill,
  selected,
  onToggle,
  onView,
  vendorName,
  amountDue,
  t,
  locale,
}: {
  bill: Bill;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  vendorName: string;
  amountDue: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
  locale: string;
}) {
  const dateLocale = billingDateLocale(locale);

  return (
    <tr
      onClick={onView}
      className={cn(
        "cursor-pointer border-b border-default-100 text-sm transition-colors hover:bg-primary/[0.03]",
        selected && "bg-primary/[0.06]"
      )}
    >
      <td className="w-10 px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
      <td className="px-3 py-2 font-medium text-default-800">
        <div className="flex items-center gap-2">
          <ContactAvatar name={vendorName} />
          <span className="truncate">{vendorName}</span>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2 text-default-500 md:table-cell">
        {bill.dueDate.toLocaleDateString(dateLocale)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span className="tabular-nums font-medium text-default-900" dir="ltr">
          {formatCurrency(bill.grandTotal, bill.currency)}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span
          className={cn(
            "tabular-nums font-semibold",
            amountDue > 0 ? "text-danger" : "text-success"
          )}
          dir="ltr"
        >
          {formatCurrency(amountDue, bill.currency)}
        </span>
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
            billStatusClass(bill.status)
          )}
        >
          {t(`bills.status.${bill.status}`)}
        </span>
      </td>
      <td className="w-12 px-2 py-2" onClick={(e) => e.stopPropagation()}>
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
  const { data: settings } = useBillingSettings();
  const contacts = contactsRes?.data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currency =
    settings?.currencies?.find((c) => c.isDefault)?.code ?? "SAR";

  const getVendorName = (vendorId: string) => {
    const contact = contacts.find((c) => c.id === vendorId);
    if (contact) return contactDisplayName(contact);
    if (vendorId.startsWith("vendor_") || vendorId.startsWith("cust_")) {
      return t("bills.unknown_vendor");
    }
    return vendorId;
  };

  const metrics = useMemo(() => {
    const outstanding = bills
      .filter((b) => b.status === "open" || b.status === "overdue")
      .reduce((sum, b) => sum + getBillAmountDue(b), 0);
    const overdue = bills
      .filter((b) => b.status === "overdue")
      .reduce((sum, b) => sum + getBillAmountDue(b), 0);
    const paid = bills.reduce((sum, b) => sum + (b.amountPaid ?? 0), 0);
    const drafts = bills.filter((b) => b.status === "draft").length;
    return { outstanding, overdue, paid, drafts };
  }, [bills]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...bills]
      .filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (!q) return true;
        return (
          b.billNumber.toLowerCase().includes(q) ||
          getVendorName(b.vendorId).toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      );
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

    const dateLocale = billingDateLocale(i18n.language);

    downloadBillsCsv(
      toExport,
      [
        t("bills.columns.date"),
        t("bills.columns.bill_number"),
        t("bills.columns.vendor"),
        t("bills.columns.due_date"),
        t("bills.columns.amount"),
        t("bills.columns.amount_due"),
        t("bills.columns.status"),
      ],
      (b) => [
        b.issueDate.toLocaleDateString(dateLocale),
        b.billNumber,
        getVendorName(b.vendorId),
        b.dueDate.toLocaleDateString(dateLocale),
        b.grandTotal,
        getBillAmountDue(b),
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
    <div className="animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={t("bills.title")}
        description={t("bills.description")}
        breadcrumbItems={[
          { label: t("module_name"), to: "/billing" },
          { label: t("bills.title") },
        ]}
      />

      <AccountingMetricCards
        items={[
          {
            key: "outstanding",
            label: t("bills.metrics.outstanding"),
            value: formatCurrency(metrics.outstanding, currency),
            icon: TrendingUp,
            className: "text-danger bg-danger/10",
          },
          {
            key: "overdue",
            label: t("bills.metrics.overdue"),
            value: formatCurrency(metrics.overdue, currency),
            icon: AlertCircle,
            className: "text-danger bg-danger/10",
          },
          {
            key: "paid",
            label: t("bills.metrics.paid"),
            value: formatCurrency(metrics.paid, currency),
            icon: CheckCircle2,
            className: "text-success bg-success/10",
          },
          {
            key: "drafts",
            label: t("bills.metrics.drafts"),
            value: String(metrics.drafts),
            icon: Clock,
            className: "text-default-600 bg-default-100",
          },
        ]}
      />

      <AccountingListShell
        toolbar={
          <>
            <Button
              size="sm"
              color="danger"
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
              className="min-w-[200px] max-w-xl flex-1"
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
          </>
        }
        filterBar={
          <StatusFilterChips
            chips={statusChips}
            active={statusFilter}
            onChange={setStatusFilter}
            countLabel={t("bills.billCount", { count: filtered.length })}
          />
        }
        footer={
          <>
            <span>
              {selectedIds.size > 0
                ? t("bills.selectedCount", { count: selectedIds.size })
                : t("bills.billCount", { count: filtered.length })}
            </span>
            <span dir="ltr">
              {filtered.length > 0 ? `1-${filtered.length} / ${filtered.length}` : "0 / 0"}
            </span>
          </>
        }
      >
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
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/80 text-xs font-semibold uppercase tracking-wide text-default-500">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox size="sm" isSelected={allSelected} onValueChange={toggleAll} />
                  </th>
                  <th className="px-3 py-2.5 text-start">{t("bills.columns.date")}</th>
                  <th className="px-3 py-2.5 text-start">{t("bills.columns.bill_number")}</th>
                  <th className="px-3 py-2.5 text-start">{t("bills.columns.vendor")}</th>
                  <th className="hidden px-3 py-2.5 text-start md:table-cell">
                    {t("bills.columns.due_date")}
                  </th>
                  <th className="px-3 py-2.5 text-end">{t("bills.columns.amount")}</th>
                  <th className="px-3 py-2.5 text-end">{t("bills.columns.amount_due")}</th>
                  <th className="px-3 py-2.5 text-start">{t("bills.columns.status")}</th>
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
                    amountDue={getBillAmountDue(bill)}
                    t={t}
                    locale={i18n.language}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AccountingListShell>

      <BillingDocumentGuide variant="bill" className="mt-4" />
    </div>
  );
}
