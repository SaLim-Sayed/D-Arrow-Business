import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { parseDate } from "@internationalized/date";
import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";
import {
  useRecordPaymentMutation,
  useRecordVendorPaymentMutation,
} from "../hooks/use-payments";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { getBillAmountDue } from "../utils/aged-reports";
import { BillingMoney } from "../components/BillingMoney";
import { DEFAULT_BILLING_CURRENCY } from "../utils/billing-currency";

const PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "card",
  "check",
  "other",
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

interface PaymentFormValues {
  amount: number;
  date: Date;
  reference: string;
  methodKey: PaymentMethodKey;
  notes: string;
}

interface RecordPaymentModalProps {
  invoice?: Invoice | null;
  bill?: Bill | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentModal({
  invoice,
  bill,
  isOpen,
  onOpenChange,
}: RecordPaymentModalProps) {
  const { t } = useTranslation("billing");
  const recordCustomerPayment = useRecordPaymentMutation();
  const recordVendorPayment = useRecordVendorPaymentMutation();
  const isVendor = !!bill;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    defaultValues: {
      amount: 0,
      date: new Date(),
      reference: "",
      methodKey: "bank_transfer",
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const amountDue = invoice
      ? getInvoiceAmountDue(invoice)
      : bill
        ? getBillAmountDue(bill)
        : 0;
    if (invoice || bill) {
      reset({
        amount: amountDue,
        date: new Date(),
        reference: "",
        methodKey: "bank_transfer",
        notes: "",
      });
    }
  }, [invoice, bill, isOpen, reset]);

  const onSubmit = async (values: PaymentFormValues) => {
    const paymentPayload = {
      amount: values.amount,
      date: values.date,
      reference: values.reference || undefined,
      methodName: t(`payments.methods.${values.methodKey}`),
      notes: values.notes || undefined,
    };

    try {
      if (invoice?.id) {
        await recordCustomerPayment.mutateAsync({ invoice, payment: paymentPayload });
      } else if (bill?.id) {
        await recordVendorPayment.mutateAsync({ bill, payment: paymentPayload });
      } else {
        return;
      }
      toast.success(t("payments.recorded"));
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "Payment exceeds amount due"
          ? t("payments.exceeds_due")
          : err instanceof Error
            ? err.message
            : t("payments.failed");
      toast.error(msg);
    }
  };

  const amountDue = invoice
    ? getInvoiceAmountDue(invoice)
    : bill
      ? getBillAmountDue(bill)
      : 0;
  const docNumber = invoice?.invoiceNumber ?? bill?.billNumber;
  const currency = invoice?.currency ?? bill?.currency ?? DEFAULT_BILLING_CURRENCY;
  const isPending =
    recordCustomerPayment.isPending || recordVendorPayment.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isVendor
                ? t("payments.record_vendor_title")
                : t("payments.record_title")}
              {docNumber && (
                <p className="mt-1 text-sm font-normal text-default-500">
                  <span dir="ltr">{docNumber}</span>
                  {" · "}
                  {t("payments.amount_due_label")}:{" "}
                  <BillingMoney amount={amountDue} currency={currency} />
                </p>
              )}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                type="number"
                step="0.01"
                label={t("payments.amount")}
                variant="flat"
                dir="ltr"
                classNames={{
                  inputWrapper:
                    "bg-white dark:bg-content1 shadow-none border border-default-200",
                }}
                {...register("amount", {
                  required: true,
                  valueAsNumber: true,
                  min: 0.01,
                  max: amountDue,
                })}
                isInvalid={!!errors.amount}
                errorMessage={errors.amount?.message}
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
                    variant="flat"
                    classNames={{
                      trigger:
                        "bg-white dark:bg-content1 shadow-none border border-default-200",
                    }}
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
                variant="flat"
                classNames={{
                  inputWrapper:
                    "bg-white dark:bg-content1 shadow-none border border-default-200",
                }}
                {...register("reference")}
              />
              <Input
                label={t("payments.notes")}
                variant="flat"
                classNames={{
                  inputWrapper:
                    "bg-white dark:bg-content1 shadow-none border border-default-200",
                }}
                {...register("notes")}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("actions.cancel")}
              </Button>
              <Button
                color={isVendor ? "danger" : "success"}
                type="submit"
                isLoading={isSubmitting || isPending}
              >
                {t("payments.record")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
