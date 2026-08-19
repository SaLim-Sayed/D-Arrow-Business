import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { parseDate } from "@internationalized/date";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import {
  useRecordPaymentMutation,
  useRecordVendorPaymentMutation,
} from "../hooks/use-payments";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { getBillAmountDue } from "../utils/aged-reports";
import { BillingMoney } from "../components/BillingMoney";
import {
  resolveBillVendorName,
  resolveInvoiceCustomerName,
} from "../utils/invoice-customer";
import { DEFAULT_BILLING_CURRENCY } from "../utils/billing-currency";
import {
  voucherDetailPath,
  voucherListPath,
  type VoucherType,
} from "../schemas/voucher";
import { AccountingPageHeader } from "../components/accounting-ui";
import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";

const PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "card",
  "check",
  "other",
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

interface VoucherFormValues {
  sourceId: string;
  amount: number;
  date: Date;
  reference: string;
  methodKey: PaymentMethodKey;
  notes: string;
}

export default function CreateVoucherPage({ type }: { type: VoucherType }) {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReceipt = type === "receipt";
  const typeKey = isReceipt ? "receipt" : "disbursement";
  const presetId = isReceipt
    ? searchParams.get("invoiceId")
    : searchParams.get("billId");

  const { data: invoices = [] } = useInvoices();
  const { data: bills = [] } = useBills();
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];
  const recordCustomerPayment = useRecordPaymentMutation();
  const recordVendorPayment = useRecordVendorPaymentMutation();

  const openInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== "cancelled" &&
      invoice.status !== "draft" &&
      getInvoiceAmountDue(invoice) > 0.001
  );
  const openBills = bills.filter(
    (bill) =>
      bill.status !== "cancelled" &&
      bill.status !== "draft" &&
      getBillAmountDue(bill) > 0.001
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VoucherFormValues>({
    defaultValues: {
      sourceId: presetId ?? "",
      amount: 0,
      date: new Date(),
      reference: "",
      methodKey: "bank_transfer",
      notes: "",
    },
  });

  const sourceId = watch("sourceId");
  const selectedInvoice = openInvoices.find((i) => i.id === sourceId) ?? null;
  const selectedBill = openBills.find((b) => b.id === sourceId) ?? null;
  const amountDue = selectedInvoice
    ? getInvoiceAmountDue(selectedInvoice)
    : selectedBill
      ? getBillAmountDue(selectedBill)
      : 0;
  const currency =
    selectedInvoice?.currency ??
    selectedBill?.currency ??
    DEFAULT_BILLING_CURRENCY;

  useEffect(() => {
    if (presetId) setValue("sourceId", presetId);
  }, [presetId, setValue]);

  useEffect(() => {
    if (amountDue > 0) setValue("amount", amountDue);
  }, [amountDue, setValue]);

  const partyName = selectedInvoice
    ? resolveInvoiceCustomerName(
        selectedInvoice,
        contacts,
        t("invoices.unknown_customer")
      )
    : selectedBill
      ? resolveBillVendorName(selectedBill, contacts, t("bills.unknown_vendor"))
      : "";

  const onSubmit = async (values: VoucherFormValues) => {
    const paymentPayload = {
      amount: values.amount,
      date: values.date,
      reference: values.reference || undefined,
      methodName: t(`payments.methods.${values.methodKey}`),
      notes: values.notes || undefined,
    };

    try {
      if (isReceipt) {
        if (!selectedInvoice?.id) {
          toast.error(t("vouchers.select_source"));
          return;
        }
        const result = await recordCustomerPayment.mutateAsync({
          invoice: selectedInvoice,
          payment: paymentPayload,
        });
        toast.success(
          result.voucher
            ? t("vouchers.recorded_with_number", {
                number: result.voucher.voucherNumber,
              })
            : t("payments.recorded")
        );
        if (result.voucher?.id) {
          navigate(voucherDetailPath(type, result.voucher.id));
          return;
        }
      } else {
        if (!selectedBill?.id) {
          toast.error(t("vouchers.select_source"));
          return;
        }
        const result = await recordVendorPayment.mutateAsync({
          bill: selectedBill,
          payment: paymentPayload,
        });
        toast.success(
          result.voucher
            ? t("vouchers.recorded_with_number", {
                number: result.voucher.voucherNumber,
              })
            : t("payments.recorded")
        );
        if (result.voucher?.id) {
          navigate(voucherDetailPath(type, result.voucher.id));
          return;
        }
      }
      navigate(voucherListPath(type));
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "Payment exceeds amount due"
          ? t("payments.exceeds_due")
          : err instanceof Error
            ? err.message
            : t("vouchers.failed");
      toast.error(msg);
    }
  };

  const isPending =
    recordCustomerPayment.isPending || recordVendorPayment.isPending;

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={t(`vouchers.${typeKey}.create_title`)}
        description={t(`vouchers.${typeKey}.create_subtitle`)}
        breadcrumbItems={[
          { label: t("module_name"), to: "/billing" },
          {
            label: t(`vouchers.${typeKey}.title`),
            to: voucherListPath(type),
          },
          { label: t(`vouchers.${typeKey}.add`) },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border border-default-100 shadow-sm">
          <CardBody className="gap-5 p-5">
            <Controller
              control={control}
              name="sourceId"
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  label={t(`vouchers.${typeKey}.source`)}
                  placeholder={t(`vouchers.${typeKey}.source_placeholder`)}
                  variant="bordered"
                  selectedKey={field.value || null}
                  onSelectionChange={(key) =>
                    field.onChange(key != null ? String(key) : "")
                  }
                  isInvalid={!!errors.sourceId}
                  listboxProps={{
                    emptyContent: t(`vouchers.${typeKey}.no_open_docs`),
                  }}
                >
                  {isReceipt
                    ? openInvoices.map((invoice) => (
                        <AutocompleteItem
                          key={invoice.id!}
                          textValue={invoiceLabel(invoice, contacts, t)}
                        >
                          <div className="flex flex-col">
                            <span dir="ltr">{invoice.invoiceNumber}</span>
                            <span className="text-xs text-default-400">
                              {resolveInvoiceCustomerName(
                                invoice,
                                contacts,
                                t("invoices.unknown_customer")
                              )}{" "}
                              ·{" "}
                              <BillingMoney
                                amount={getInvoiceAmountDue(invoice)}
                                currency={invoice.currency}
                              />
                            </span>
                          </div>
                        </AutocompleteItem>
                      ))
                    : openBills.map((bill) => (
                        <AutocompleteItem
                          key={bill.id!}
                          textValue={billLabel(bill, contacts, t)}
                        >
                          <div className="flex flex-col">
                            <span dir="ltr">{bill.billNumber}</span>
                            <span className="text-xs text-default-400">
                              {resolveBillVendorName(
                                bill,
                                contacts,
                                t("bills.unknown_vendor")
                              )}{" "}
                              ·{" "}
                              <BillingMoney
                                amount={getBillAmountDue(bill)}
                                currency={bill.currency}
                              />
                            </span>
                          </div>
                        </AutocompleteItem>
                      ))}
                </Autocomplete>
              )}
            />

            {(selectedInvoice || selectedBill) && (
              <div className="rounded-lg border border-default-200 bg-default-50/70 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-default-400">
                      {t(`vouchers.${typeKey}.party`)}
                    </p>
                    <p className="mt-0.5 font-medium">{partyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-default-400">
                      {t("vouchers.amount_due")}
                    </p>
                    <p className="mt-0.5 font-semibold">
                      <BillingMoney amount={amountDue} currency={currency} />
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Input
              type="number"
              step="0.01"
              label={t("payments.amount")}
              variant="bordered"
              dir="ltr"
              {...register("amount", {
                required: true,
                valueAsNumber: true,
                min: 0.01,
                max: amountDue || undefined,
              })}
              isInvalid={!!errors.amount}
            />

            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <AppDatePicker
                  label={t("payments.date")}
                  value={
                    field.value
                      ? parseDate(field.value.toISOString().slice(0, 10))
                      : null
                  }
                  onChange={(d: { toString(): string } | null) => {
                    if (d) field.onChange(new Date(d.toString()));
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="methodKey"
              render={({ field }) => (
                <Select
                  label={t("payments.method")}
                  selectedKeys={[field.value]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as PaymentMethodKey;
                    if (key) field.onChange(key);
                  }}
                  variant="bordered"
                >
                  {PAYMENT_METHODS.map((key) => (
                    <SelectItem key={key}>
                      {t(`payments.methods.${key}`)}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />

            <Input
              label={t("payments.reference")}
              variant="bordered"
              {...register("reference")}
            />
            <Input
              label={t("payments.notes")}
              variant="bordered"
              {...register("notes")}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="light"
                onPress={() => navigate(voucherListPath(type))}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                color={isReceipt ? "success" : "danger"}
                type="submit"
                isLoading={isSubmitting || isPending}
              >
                {t(`vouchers.${typeKey}.submit`)}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}

function invoiceLabel(
  invoice: Invoice,
  contacts: Parameters<typeof resolveInvoiceCustomerName>[1],
  t: (key: string) => string
) {
  return `${invoice.invoiceNumber} ${resolveInvoiceCustomerName(
    invoice,
    contacts,
    t("invoices.unknown_customer")
  )}`;
}

function billLabel(
  bill: Bill,
  contacts: Parameters<typeof resolveBillVendorName>[1],
  t: (key: string) => string
) {
  return `${bill.billNumber} ${resolveBillVendorName(
    bill,
    contacts,
    t("bills.unknown_vendor")
  )}`;
}
