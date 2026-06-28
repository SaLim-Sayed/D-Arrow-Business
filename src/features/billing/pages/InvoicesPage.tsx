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
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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
import { useInvoices } from "../hooks/use-invoices";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import type { Invoice } from "../schemas/invoice";
import { downloadInvoicesCsv } from "../utils/invoice-export";
import { BillingDocumentGuide } from "../components/BillingDocumentGuide";

type StatusFilter = "all" | Invoice["status"];

const STATUS_ORDER: Invoice["status"][] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

function invoiceStatusClass(status: Invoice["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "overdue") return "bg-danger/10 text-danger";
  if (status === "sent") return "bg-primary/10 text-primary";
  if (status === "cancelled") return "bg-default-100 text-default-400";
  return "bg-default-100 text-default-500";
}

function InvoiceRow({
  invoice,
  selected,
  onToggle,
  onView,
  customerName,
  t,
  locale,
}: {
  invoice: Invoice;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  customerName: string;
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
          aria-label={invoice.invoiceNumber}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-default-600">
        {invoice.issueDate.toLocaleDateString(dateLocale)}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <button
          type="button"
          onClick={onView}
          className="font-mono font-semibold text-primary hover:underline"
          dir="ltr"
        >
          {invoice.invoiceNumber}
        </button>
      </td>
      <td className="px-3 py-2 font-medium text-default-800">{customerName}</td>
      <td className="hidden whitespace-nowrap px-3 py-2 text-default-500 md:table-cell">
        {invoice.dueDate.toLocaleDateString(dateLocale)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-end">
        <span className="tabular-nums font-medium text-default-900" dir="ltr">
          {formatCurrency(invoice.grandTotal, invoice.currency)}
        </span>
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
            invoiceStatusClass(invoice.status)
          )}
        >
          {t(`invoices.status.${invoice.status}`)}
        </span>
      </td>
      <td className="w-12 px-2 py-2">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label={t("invoices.view")}
          onPress={onView}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export default function InvoicesPage() {
  const { t, i18n } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getCustomerName = (customerId: string) => {
    const contact = contacts.find((c) => c.id === customerId);
    if (contact) return contactDisplayName(contact);
    if (customerId.startsWith("cust_") || customerId.startsWith("vendor_")) {
      return t("invoices.unknown_customer");
    }
    return customerId;
  };

  const metrics = useMemo(() => {
    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);
    const overdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + (i.grandTotal - (i.amountPaid || 0)), 0);
    const paid = invoices
      .filter((i) => i.status === "paid" || (i.amountPaid && i.amountPaid > 0))
      .reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const drafts = invoices.filter((i) => i.status === "draft").length;
    return { outstanding, overdue, paid, drafts };
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.invoiceNumber.toLowerCase().includes(q) ||
        getCustomerName(i.customerId).toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter, contacts, t]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((i) => i.id && selectedIds.has(i.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else
      setSelectedIds(new Set(filtered.map((i) => i.id!).filter(Boolean)));
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
        ? filtered.filter((i) => i.id && selectedIds.has(i.id))
        : filtered;

    if (toExport.length === 0) {
      toast.error(t("invoices.export_empty"));
      return;
    }

    const dateLocale = i18n.language.startsWith("ar") ? "ar-SA" : undefined;

    downloadInvoicesCsv(
      toExport,
      [
        t("invoices.columns.date"),
        t("invoices.columns.invoice_number"),
        t("invoices.columns.customer"),
        t("invoices.columns.due_date"),
        t("invoices.columns.amount"),
        t("invoices.columns.status"),
      ],
      (inv) => [
        inv.issueDate.toLocaleDateString(dateLocale),
        inv.invoiceNumber,
        getCustomerName(inv.customerId),
        inv.dueDate.toLocaleDateString(dateLocale),
        inv.grandTotal,
        t(`invoices.status.${inv.status}`),
      ]
    );
    toast.success(t("invoices.export_success"));
  };

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("invoices.filters.all") },
    ...STATUS_ORDER.map((status) => ({
      key: status as StatusFilter,
      label: t(`invoices.status.${status}`),
    })),
  ];

  const metricCards = [
    {
      key: "outstanding",
      label: t("invoices.metrics.outstanding"),
      value: formatCurrency(metrics.outstanding, "USD"),
      icon: TrendingUp,
      className: "text-primary bg-primary/10",
    },
    {
      key: "overdue",
      label: t("invoices.metrics.overdue"),
      value: formatCurrency(metrics.overdue, "USD"),
      icon: AlertCircle,
      className: "text-danger bg-danger/10",
    },
    {
      key: "paid",
      label: t("invoices.metrics.paid"),
      value: formatCurrency(metrics.paid, "USD"),
      icon: CheckCircle2,
      className: "text-success bg-success/10",
    },
    {
      key: "drafts",
      label: t("invoices.metrics.drafts"),
      value: String(metrics.drafts),
      icon: Clock,
      className: "text-default-600 bg-default-100",
      isCount: true,
    },
  ];

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <nav className="mb-3 flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">{t("invoices.title")}</span>
      </nav>

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-default-900">
          {t("invoices.title")}
        </h1>
        <p className="mt-1 text-sm text-default-500">{t("invoices.description")}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metricCards.map(({ key, label, value, icon: Icon, className, isCount }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-lg border border-default-200 bg-content1 px-3 py-2.5 shadow-sm"
          >
            <div className={cn("rounded-lg p-2", className)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-default-500">{label}</p>
              <p
                className={cn(
                  "truncate text-base font-bold text-default-900",
                  !isCount && "tabular-nums"
                )}
                dir={isCount ? undefined : "ltr"}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="border-b border-default-200 bg-default-50/90">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Button
              size="sm"
              color="primary"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => navigate("/billing/invoices/new")}
            >
              {t("invoices.add")}
            </Button>

            <Button
              size="sm"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExport}
            >
              {t("invoices.export")}
            </Button>

            <div className="mx-1 hidden h-5 w-px bg-default-200 sm:block" />

            <Input
              size="sm"
              variant="flat"
              className="min-w-[200px] flex-1 max-w-xl"
              placeholder={t("invoices.search")}
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
                  {t("invoices.filters.status")}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label={t("invoices.filters.status")}
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
              {t("invoices.invoiceCount", { count: filtered.length })}
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
              {t("invoices.empty")}
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
                    {t("invoices.columns.date")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("invoices.columns.invoice_number")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("invoices.columns.customer")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                    {t("invoices.columns.due_date")}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t("invoices.columns.amount")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("invoices.columns.status")}
                  </th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    selected={!!invoice.id && selectedIds.has(invoice.id)}
                    onToggle={() => invoice.id && toggleOne(invoice.id)}
                    onView={() => navigate(`/billing/invoices/${invoice.id}`)}
                    customerName={getCustomerName(invoice.customerId)}
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
              ? t("invoices.selectedCount", { count: selectedIds.size })
              : t("invoices.invoiceCount", { count: filtered.length })}
          </span>
          <span>1 / 1</span>
        </div>
      </div>

      <BillingDocumentGuide variant="invoice" className="mt-4" />
    </div>
  );
}
