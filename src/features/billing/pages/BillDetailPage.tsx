import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@heroui/react";
import { CreditCard, Edit2 } from "lucide-react";
import { useBill } from "../hooks/use-bills";
import { usePayments } from "../hooks/use-payments";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import { useAccounts } from "../hooks/use-accounts";
import { cn, formatCurrency } from "@/lib/utils";
import { getBillAmountDue } from "../utils/aged-reports";
import { billingDateLocale } from "../utils/locale";
import type { Bill } from "../schemas/bill";
import { AccountingPageHeader } from "../components/accounting-ui";
import { BillingDocumentGuide } from "../components/BillingDocumentGuide";
import { RecordPaymentModal } from "../components/RecordPaymentModal";

function billStatusClass(status: Bill["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "overdue") return "bg-danger/10 text-danger";
  if (status === "open") return "bg-warning/10 text-warning-700 dark:text-warning";
  if (status === "cancelled") return "bg-default-100 text-default-400";
  return "bg-default-100 text-default-500";
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("billing");
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: bill, isLoading } = useBill(id);
  const { data: payments = [] } = usePayments({ billId: id });
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const { data: accounts = [] } = useAccounts();

  const dateLocale = billingDateLocale(i18n.language);

  const getVendorName = (vendorId: string) => {
    const contact = contacts.find((c) => c.id === vendorId);
    if (contact) return contactDisplayName(contact);
    if (vendorId.startsWith("vendor_") || vendorId.startsWith("cust_")) {
      return t("bills.unknown_vendor");
    }
    return vendorId;
  };

  const getAccountLabel = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return accountId;
    return t(`accounts.names.${account.name}`, { defaultValue: account.name });
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-default-500">
        {t("bills.detail.loading")}
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex justify-center p-10">
        <p className="text-default-500">{t("bills.detail.not_found")}</p>
      </div>
    );
  }

  const amountDue = getBillAmountDue(bill);

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={bill.billNumber}
        description={bill.issueDate.toLocaleDateString(dateLocale)}
        breadcrumbItems={[
          { label: t("module_name"), to: "/billing" },
          { label: t("bills.title"), to: "/billing/bills" },
          { label: bill.billNumber },
        ]}
        action={
          <>
            {amountDue > 0 &&
              bill.status !== "draft" &&
              bill.status !== "cancelled" && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<CreditCard className="h-4 w-4" />}
                  onPress={() => setPaymentOpen(true)}
                >
                  {t("bills.detail.record_payment")}
                </Button>
              )}
            {bill.status === "draft" && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Edit2 className="h-4 w-4" />}
                onPress={() => navigate(`/billing/bills/${bill.id}/edit`)}
              >
                {t("bills.detail.edit")}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium",
            billStatusClass(bill.status)
          )}
        >
          {t(`bills.status.${bill.status}`)}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
        <div className="grid gap-4 border-b border-default-200 bg-default-50/50 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-default-400">
              {t("bills.detail.vendor")}
            </p>
            <p className="mt-1 font-medium text-default-900">
              {getVendorName(bill.vendorId)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-default-400">
              {t("bills.detail.due_date")}
            </p>
            <p className="mt-1 font-medium text-default-900">
              {bill.dueDate.toLocaleDateString(dateLocale)}
            </p>
          </div>
          <div className="rounded-lg bg-danger/10 p-3">
            <p className="text-xs font-semibold uppercase text-default-500">
              {t("bills.detail.amount_due")}
            </p>
            <p className="mt-1 text-xl font-bold text-danger" dir="ltr">
              {formatCurrency(amountDue, bill.currency)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-start">
            <thead>
              <tr className="border-b border-default-200 bg-default-50/50 text-xs uppercase tracking-wide text-default-500">
                <th className="px-4 py-2.5 font-semibold">
                  {t("bills.detail.account")}
                </th>
                <th className="px-4 py-2.5 font-semibold">
                  {t("bills.detail.description")}
                </th>
                <th className="px-4 py-2.5 text-end font-semibold">
                  {t("bills.detail.qty")}
                </th>
                <th className="px-4 py-2.5 text-end font-semibold">
                  {t("bills.detail.rate")}
                </th>
                <th className="hidden px-4 py-2.5 text-end font-semibold sm:table-cell">
                  {t("bills.detail.tax")}
                </th>
                <th className="px-4 py-2.5 text-end font-semibold">
                  {t("bills.detail.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <tr key={idx} className="border-b border-default-100 text-sm">
                  <td className="px-4 py-3 text-default-600">
                    {getAccountLabel(item.accountId)}
                  </td>
                  <td className="px-4 py-3 font-medium text-default-900">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums" dir="ltr">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums" dir="ltr">
                    {formatCurrency(item.unitPrice, bill.currency)}
                  </td>
                  <td className="hidden px-4 py-3 text-end tabular-nums sm:table-cell" dir="ltr">
                    {item.taxRate > 0 ? `${item.taxRate}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-end font-medium tabular-nums" dir="ltr">
                    {formatCurrency(item.total, bill.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-default-200 bg-default-50/30 p-4">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-default-500">{t("bills.detail.subtotal")}</span>
              <span className="tabular-nums font-medium" dir="ltr">
                {formatCurrency(bill.subTotal, bill.currency)}
              </span>
            </div>
            {bill.totalTax > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-default-500">{t("bills.detail.total_tax")}</span>
                <span className="tabular-nums font-medium" dir="ltr">
                  {formatCurrency(bill.totalTax, bill.currency)}
                </span>
              </div>
            )}
            <Divider />
            <div className="flex justify-between gap-4 text-base font-bold">
              <span>{t("bills.detail.total")}</span>
              <span className="tabular-nums" dir="ltr">
                {formatCurrency(bill.grandTotal, bill.currency)}
              </span>
            </div>
            {(bill.amountPaid ?? 0) > 0 && (
              <>
                <div className="flex justify-between gap-4 text-sm font-medium text-success">
                  <span>{t("bills.detail.paid")}</span>
                  <span className="tabular-nums" dir="ltr">
                    -{formatCurrency(bill.amountPaid ?? 0, bill.currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 rounded-lg bg-danger/5 px-3 py-2 text-base font-bold text-danger">
                  <span>{t("bills.detail.balance_due")}</span>
                  <span className="tabular-nums" dir="ltr">
                    {formatCurrency(amountDue, bill.currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {payments.length > 0 && (
          <div className="border-t border-default-200 px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase text-default-400">
              {t("payments.history")}
            </p>
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>
                    {p.date.toLocaleDateString(dateLocale)}
                    {p.methodName ? ` — ${p.methodName}` : ""}
                    {p.reference ? ` (${p.reference})` : ""}
                  </span>
                  <span className="font-medium text-danger" dir="ltr">
                    {formatCurrency(p.amount, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bill.notes && (
          <div className="border-t border-default-200 px-4 py-4">
            <p className="text-xs font-semibold uppercase text-default-400">
              {t("bills.detail.notes")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-default-600">
              {bill.notes}
            </p>
          </div>
        )}
      </div>

      <BillingDocumentGuide variant="bill" className="mt-4" />

      <RecordPaymentModal
        bill={bill}
        isOpen={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </div>
  );
}
