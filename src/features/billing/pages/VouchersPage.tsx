import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Spinner } from "@heroui/react";
import { Banknote, Calendar, Eye, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { BillingMoney } from "../components/BillingMoney";
import { useVouchers } from "../hooks/use-vouchers";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { billingDateLocale } from "../utils/locale";
import { getDefaultBillingCurrency } from "../utils/billing-currency";
import {
  voucherDetailPath,
  voucherNewPath,
  type Voucher,
  type VoucherType,
} from "../schemas/voucher";
import {
  AccountingListShell,
  AccountingMetricCards,
  AccountingPageHeader,
  ContactAvatar,
} from "../components/accounting-ui";

export default function VouchersPage({ type }: { type: VoucherType }) {
  const { t, i18n } = useTranslation("billing");
  const navigate = useNavigate();
  const { data: vouchers = [], isLoading } = useVouchers(type);
  const { data: settings } = useBillingSettings();
  const [search, setSearch] = useState("");
  const dateLocale = billingDateLocale(i18n.language);
  const currency = getDefaultBillingCurrency(settings);
  const isReceipt = type === "receipt";
  const typeKey = isReceipt ? "receipt" : "disbursement";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vouchers;
    return vouchers.filter((v) => {
      const hay = [
        v.voucherNumber,
        v.partyName,
        v.invoiceNumber,
        v.billNumber,
        v.methodName,
        v.reference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [vouchers, search]);

  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = vouchers.filter(
      (v) =>
        v.date.getMonth() === now.getMonth() &&
        v.date.getFullYear() === now.getFullYear()
    );
    return {
      total: vouchers.reduce((sum, v) => sum + v.amount, 0),
      count: vouchers.length,
      monthTotal: thisMonth.reduce((sum, v) => sum + v.amount, 0),
      monthCount: thisMonth.length,
    };
  }, [vouchers]);

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={t(`vouchers.${typeKey}.title`)}
        description={t(`vouchers.${typeKey}.description`)}
        breadcrumbItems={[
          { label: t("module_name"), to: "/billing" },
          { label: t(`vouchers.${typeKey}.title`) },
        ]}
        action={
          <Button
            color={isReceipt ? "success" : "danger"}
            className="font-semibold"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => navigate(voucherNewPath(type))}
          >
            {t(`vouchers.${typeKey}.add`)}
          </Button>
        }
      />

      <AccountingMetricCards
        items={[
          {
            key: "total",
            label: t(`vouchers.${typeKey}.metrics.total`),
            value: <BillingMoney amount={metrics.total} currency={currency} />,
            icon: Banknote,
            className: isReceipt
              ? "text-success bg-success/10"
              : "text-danger bg-danger/10",
          },
          {
            key: "count",
            label: t("vouchers.metrics.count"),
            value: metrics.count,
            icon: Banknote,
            className: "text-default-600 bg-default-100",
          },
          {
            key: "month",
            label: t("vouchers.metrics.this_month"),
            value: (
              <BillingMoney amount={metrics.monthTotal} currency={currency} />
            ),
            icon: Calendar,
            className: "text-primary bg-primary/10",
          },
          {
            key: "monthCount",
            label: t("vouchers.metrics.month_count"),
            value: metrics.monthCount,
            icon: Calendar,
            className: "text-default-600 bg-default-100",
          },
        ]}
      />

      <AccountingListShell
        toolbar={
          <Input
            size="sm"
            variant="flat"
            placeholder={t(`vouchers.${typeKey}.search`)}
            value={search}
            onValueChange={setSearch}
            startContent={<Search className="h-4 w-4 text-default-400" />}
            className="max-w-sm"
            classNames={{
              inputWrapper:
                "bg-white dark:bg-content1 shadow-none border border-default-200",
            }}
          />
        }
        footer={
          <span>{t("vouchers.count_label", { count: filtered.length })}</span>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-default-400">
            {t(`vouchers.${typeKey}.empty`)}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-start text-sm">
              <thead>
                <tr className="border-b border-default-200 bg-default-50/80 text-xs uppercase tracking-wide text-default-500">
                  <th className="px-3 py-2.5 font-semibold">
                    {t("vouchers.columns.number")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("vouchers.columns.date")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t(`vouchers.${typeKey}.party`)}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("vouchers.columns.source")}
                  </th>
                  <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                    {t("vouchers.columns.method")}
                  </th>
                  <th className="px-3 py-2.5 text-end font-semibold">
                    {t("vouchers.columns.amount")}
                  </th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((voucher) => (
                  <VoucherRow
                    key={voucher.id}
                    voucher={voucher}
                    type={type}
                    dateLocale={dateLocale}
                    isReceipt={isReceipt}
                    onView={() =>
                      voucher.id &&
                      navigate(voucherDetailPath(type, voucher.id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AccountingListShell>
    </div>
  );
}

function VoucherRow({
  voucher,
  type,
  dateLocale,
  isReceipt,
  onView,
}: {
  voucher: Voucher;
  type: VoucherType;
  dateLocale?: string;
  isReceipt: boolean;
  onView: () => void;
}) {
  return (
    <tr
      onClick={onView}
      className="cursor-pointer border-b border-default-100 hover:bg-default-50"
    >
      <td className="px-3 py-2.5 font-mono font-semibold" dir="ltr">
        {voucher.voucherNumber}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-default-500">
        {voucher.date.toLocaleDateString(dateLocale)}
      </td>
      <td className="px-3 py-2.5 font-medium text-default-800">
        <div className="flex items-center gap-2">
          <ContactAvatar name={voucher.partyName} />
          <span className="truncate">{voucher.partyName}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 font-mono text-default-600" dir="ltr">
        {voucher.invoiceNumber || voucher.billNumber || "—"}
      </td>
      <td className="hidden px-3 py-2.5 text-default-500 md:table-cell">
        {voucher.methodName || "—"}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-end">
        <BillingMoney
          amount={voucher.amount}
          currency={voucher.currency}
          className={cn(
            "font-semibold",
            isReceipt ? "text-success" : "text-danger"
          )}
        />
      </td>
      <td className="w-12 px-2 py-2" onClick={(e) => e.stopPropagation()}>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          aria-label={type}
          onPress={onView}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
