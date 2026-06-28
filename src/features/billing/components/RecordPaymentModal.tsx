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
import { useRecordPaymentMutation } from "../hooks/use-payments";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { formatCurrency } from "@/lib/utils";

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
  invoice: Invoice | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentModal({
  invoice,
  isOpen,
  onOpenChange,
}: RecordPaymentModalProps) {
  const { t } = useTranslation("billing");
  const recordPayment = useRecordPaymentMutation();

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
    if (invoice && isOpen) {
      reset({
        amount: getInvoiceAmountDue(invoice),
        date: new Date(),
        reference: "",
        methodKey: "bank_transfer",
        notes: "",
      });
    }
  }, [invoice, isOpen, reset]);

  const onSubmit = async (values: PaymentFormValues) => {
    if (!invoice?.id) return;
    try {
      await recordPayment.mutateAsync({
        invoice,
        payment: {
          amount: values.amount,
          date: values.date,
          reference: values.reference || undefined,
          methodName: t(`payments.methods.${values.methodKey}`),
          notes: values.notes || undefined,
        },
      });
      toast.success(t("payments.recorded"));
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("payments.failed")
      );
    }
  };

  const amountDue = invoice ? getInvoiceAmountDue(invoice) : 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {t("payments.record_title")}
              {invoice && (
                <p className="mt-1 text-sm font-normal text-default-500">
                  {invoice.invoiceNumber} —{" "}
                  <span dir="ltr">{formatCurrency(amountDue, invoice.currency)}</span>{" "}
                  {t("payments.due")}
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
                    onChange={(d) => {
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
                color="success"
                type="submit"
                isLoading={isSubmitting || recordPayment.isPending}
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
