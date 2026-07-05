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
import { cn } from "@/lib/utils";
import { BillingMoney } from "../components/BillingMoney";
import { useInvoices } from "../hooks/use-invoices";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { getDefaultBillingCurrency } from "../utils/billing-currency";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import type { Invoice } from "../schemas/invoice";
import { downloadInvoicesCsv } from "../utils/invoice-export";
import { BillingDocumentGuide } from "../components/BillingDocumentGuide";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { billingDateLocale } from "../utils/locale";
import {
  AccountingListShell,
  AccountingMetricCards,
  AccountingPageHeader,
  ContactAvatar,
  invoiceStatusClass,
  StatusFilterChips,
} from "../components/accounting-ui";

type StatusFilter = "all" | Invoice["status"];

const STATUS_ORDER: Invoice["status"][] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

export default function InvoicesPage() {
  const { t, i18n } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const { data: settings } = useBillingSettings();
  const currency = getDefaultBillingCurrency(settings);
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
      .reduce((sum, i) => sum + getInvoiceAmountDue(i), 0);
    const overdue = invoices
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + getInvoiceAmountDue(i), 0);
    const paid = invoices.reduce((sum, i) => sum + (i.amountPaid ?? 0), 0);
    const drafts = invoices.filter((i) => i.status === "draft").length;
    return { outstanding, overdue, paid, drafts };
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...invoices]
      .filter((i) => {
        if (statusFilter !== "all" && i.status !== statusFilter) return false;
        if (!q) return true;
        return (
          i.invoiceNumber.toLowerCase().includes(q) ||
          getCustomerName(i.customerId).toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      );
  }, [invoices, search, statusFilter, contacts, t]);

  const allSelected =
    filtered.length > 0 && filtered.every((i) => i.id && selectedIds.has(i.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((i) => i.id!).filter(Boolean)));
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

    const dateLocale = billingDateLocale(i18n.language);

    downloadInvoicesCsv(
      toExport,
      [
        t("invoices.columns.date"),
        t("invoices.columns.invoice_number"),
        t("invoices.columns.customer"),
        t("invoices.columns.due_date"),
        t("invoices.columns.amount"),
        t("invoices.columns.amount_due"),
        t("invoices.columns.status"),
      ],
      (inv) => [
        inv.issueDate.toLocaleDateString(dateLocale),
        inv.invoiceNumber,
        getCustomerName(inv.customerId),
        inv.dueDate.toLocaleDateString(dateLocale),
        inv.grandTotal,
        getInvoiceAmountDue(inv),
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

  const dateLocale = billingDateLocale(i18n.language);

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={t("invoices.title")}
        description={t("invoices.description")}
        breadcrumbItems={[
          { label: t("module_name"), to: "/billing" },
          { label: t("invoices.title") },
        ]}
      />

      <AccountingMetricCards
        items={[
          {
            key: "outstanding",
            label: t("invoices.metrics.outstanding"),
            value: <BillingMoney amount={metrics.outstanding} currency={currency} />,
            icon: TrendingUp,
            className: "text-primary bg-primary/10",
          },
          {
            key: "overdue",
            label: t("invoices.metrics.overdue"),
            value: <BillingMoney amount={metrics.overdue} currency={currency} />,
            icon: AlertCircle,
            className: "text-danger bg-danger/10",
          },
          {
            key: "paid",
            label: t("invoices.metrics.paid"),
            value: <BillingMoney amount={metrics.paid} currency={currency} />,
            icon: CheckCircle2,
            className: "text-success bg-success/10",
          },
          {
            key: "drafts",
            label: t("invoices.metrics.drafts"),
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
              className="min-w-[200px] max-w-xl flex-1"
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
                <Button size="sm" variant="flat" startContent={<Filter className="h-4 w-4" />}>
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
          </>
        }
        filterBar={
          <StatusFilterChips
            chips={statusChips}
            active={statusFilter}
            onChange={setStatusFilter}
            countLabel={t("invoices.invoiceCount", { count: filtered.length })}
          />
        }
        footer={
          <>
            <span>
              {selectedIds.size > 0
                ? t("invoices.selectedCount", { count: selectedIds.size })
                : t("invoices.invoiceCount", { count: filtered.length })}
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
            <div className="py-16 text-center text-default-500">{t("invoices.empty")}</div>
          ) : (
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/80 text-xs font-semibold uppercase tracking-wide text-default-500">
                  <th className="w-10 px-3 py-2.5">
                    <Checkbox size="sm" isSelected={allSelected} onValueChange={toggleAll} />
                  </th>
                  <th className="px-3 py-2.5 text-start">{t("invoices.columns.date")}</th>
                  <th className="px-3 py-2.5 text-start">{t("invoices.columns.invoice_number")}</th>
                  <th className="px-3 py-2.5 text-start">{t("invoices.columns.customer")}</th>
                  <th className="hidden px-3 py-2.5 text-start md:table-cell">
                    {t("invoices.columns.due_date")}
                  </th>
                  <th className="px-3 py-2.5 text-end">{t("invoices.columns.amount")}</th>
                  <th className="px-3 py-2.5 text-end">{t("invoices.columns.amount_due")}</th>
                  <th className="px-3 py-2.5 text-start">{t("invoices.columns.status")}</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => {
                  const customerName = getCustomerName(invoice.customerId);
                  const amountDue = getInvoiceAmountDue(invoice);
                  const view = () => invoice.id && navigate(`/billing/invoices/${invoice.id}`);

                  return (
                    <tr
                      key={invoice.id}
                      onClick={view}
                      className={cn(
                        "cursor-pointer border-b border-default-100 transition-colors hover:bg-primary/[0.03]",
                        invoice.id && selectedIds.has(invoice.id) && "bg-primary/[0.06]"
                      )}
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="sm"
                          isSelected={!!invoice.id && selectedIds.has(invoice.id)}
                          onValueChange={() => invoice.id && toggleOne(invoice.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-default-600">
                        {invoice.issueDate.toLocaleDateString(dateLocale)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-primary" dir="ltr">
                            {invoice.invoiceNumber}
                          </span>
                          {invoice.totalTax > 0 && invoice.status !== "draft" && (
                            <span className="rounded bg-success/10 px-1 py-0.5 text-[10px] font-bold text-success">
                              {t("daftra.zatca.badge")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <ContactAvatar name={customerName} />
                          <span className="truncate font-medium text-default-800">
                            {customerName}
                          </span>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-default-500 md:table-cell">
                        {invoice.dueDate.toLocaleDateString(dateLocale)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end">
                        <BillingMoney
                          amount={invoice.grandTotal}
                          currency={invoice.currency}
                          className="font-medium text-default-900"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end">
                        <BillingMoney
                          amount={amountDue}
                          currency={invoice.currency}
                          className={cn(
                            "font-semibold",
                            amountDue > 0 ? "text-danger" : "text-success"
                          )}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-xs font-medium",
                            invoiceStatusClass(invoice.status)
                          )}
                        >
                          {t(`invoices.status.${invoice.status}`)}
                        </span>
                      </td>
                      <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          aria-label={t("invoices.view")}
                          onPress={view}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AccountingListShell>

      <div className="mt-4">
        <BillingDocumentGuide variant="invoice" />
      </div>
    </div>
  );
}
