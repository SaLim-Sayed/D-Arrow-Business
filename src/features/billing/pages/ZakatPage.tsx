import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { Controller, useForm } from "react-hook-form";
import { parseDate } from "@internationalized/date";
import { CheckCircle2, HandCoins, Landmark, Scale, Settings } from "lucide-react";
import { AppDatePicker } from "@/components/shared/app-date-picker";
import { formatCurrency, cn } from "@/lib/utils";
import { AccountingPageHeader } from "../components/accounting-ui";
import { ReportDataTable } from "../components/report-ui";
import { useAccounts } from "../hooks/use-accounts";
import {
  useAccrueZakatMutation,
  useRecordZakatPaymentMutation,
  useZakatCalculation,
  useZakatCurrency,
  useZakatRecords,
} from "../hooks/use-zakat";
import type { ZakatRecord } from "../schemas/zakat";

function statusColor(status: ZakatRecord["status"]) {
  if (status === "paid") return "bg-success/10 text-success";
  if (status === "accrued") return "bg-warning/10 text-warning-700 dark:text-warning";
  return "bg-default-100 text-default-500";
}

interface AccrueFormValues {
  fiscalYear: string;
  periodEnd: Date;
  ratePercent: number;
  notes: string;
}

function AccrueZakatModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("billing");
  const currency = useZakatCurrency();
  const accrueZakat = useAccrueZakatMutation();
  // Baseline calculation (no override) just to read the company's configured rate from settings.
  const configured = useZakatCalculation();

  const { control, register, handleSubmit, reset, watch, setValue, formState } = useForm<AccrueFormValues>({
    defaultValues: {
      fiscalYear: String(new Date().getFullYear()),
      periodEnd: new Date(),
      ratePercent: configured.configuredRatePercent,
      notes: "",
    },
  });

  useEffect(() => {
    // Sync the rate field once the configured settings rate loads, without
    // clobbering a value the user has already started editing.
    if (!formState.dirtyFields.ratePercent) {
      setValue("ratePercent", configured.configuredRatePercent);
    }
  }, [configured.configuredRatePercent, formState.dirtyFields.ratePercent, setValue]);

  const ratePercent = watch("ratePercent");
  // Recomputed live as the user edits the rate, so the preview always matches what will be posted.
  const calculation = useZakatCalculation(
    Number.isFinite(Number(ratePercent)) ? Number(ratePercent) : undefined
  );

  const onSubmit = async (values: AccrueFormValues) => {
    try {
      await accrueZakat.mutateAsync({
        fiscalYear: values.fiscalYear,
        periodEnd: values.periodEnd,
        notes: values.notes,
        eligibleAssets: calculation.eligibleAssets,
        currentLiabilities: calculation.currentLiabilities,
        zakatBase: calculation.zakatBase,
        rate: calculation.rate,
        zakatDue: calculation.zakatDue,
      });
      toast.success(t("zakat.accrue_success"));
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("zakat.accrue_failed"));
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalContent>
        {() => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>{t("zakat.accrue_title")}</ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label={t("zakat.fiscal_year")}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-white dark:bg-content1 shadow-none border border-default-200",
                }}
                {...register("fiscalYear", { required: true })}
              />
              <Controller
                control={control}
                name="periodEnd"
                render={({ field }) => (
                  <AppDatePicker
                    label={t("zakat.period_end")}
                    value={parseDate(field.value.toISOString().slice(0, 10))}
                    onChange={(d: { toString(): string } | null) => {
                      if (d) field.onChange(new Date(d.toString()));
                    }}
                  />
                )}
              />
              <Input
                type="number"
                step="0.1"
                min={0}
                max={100}
                label={t("zakat.rate")}
                description={t("zakat.rate_hint")}
                endContent={<span className="text-xs text-default-400">%</span>}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-white dark:bg-content1 shadow-none border border-default-200",
                }}
                dir="ltr"
                {...register("ratePercent", { valueAsNumber: true, min: 0, max: 100 })}
              />
              <Textarea
                label={t("zakat.notes")}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-white dark:bg-content1 shadow-none border border-default-200",
                }}
                {...register("notes")}
              />
              <div className="rounded-lg border border-default-200 bg-default-50/60 px-4 py-3 text-sm dark:bg-default-50/5">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-default-500">{t("zakat.zakat_base")}</span>
                  <span className="font-medium tabular-nums" dir="ltr">
                    {formatCurrency(calculation.zakatBase, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5 font-bold">
                  <span className="text-default-800">{t("zakat.zakat_due")}</span>
                  <span className="tabular-nums text-primary" dir="ltr">
                    {formatCurrency(calculation.zakatDue, currency)}
                  </span>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("actions.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={accrueZakat.isPending}>
                {t("zakat.accrue_confirm")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}

function RecordZakatPaymentModal({
  record,
  onClose,
}: {
  record: ZakatRecord | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("billing");
  const { data: accounts = [] } = useAccounts();
  const recordPayment = useRecordZakatPaymentMutation();
  const bankAccounts = useMemo(
    () => accounts.filter((a) => a.subType === "bank" || a.subType === "cash"),
    [accounts]
  );

  const { control, handleSubmit, reset } = useForm<{ bankAccountId: string; date: Date }>({
    defaultValues: { bankAccountId: bankAccounts[0]?.id ?? "", date: new Date() },
  });

  if (!record) return null;

  const onSubmit = async (values: { bankAccountId: string; date: Date }) => {
    if (!values.bankAccountId) {
      toast.error(t("zakat.select_bank_account"));
      return;
    }
    try {
      await recordPayment.mutateAsync({ record, bankAccountId: values.bankAccountId, date: values.date });
      toast.success(t("zakat.payment_success"));
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("zakat.payment_failed"));
    }
  };

  return (
    <Modal isOpen={!!record} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalContent>
        {() => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {t("zakat.payment_title")}
              <p className="mt-1 text-sm font-normal text-default-500">
                {record.fiscalYear} ·{" "}
                <span dir="ltr">{formatCurrency(record.zakatDue, record.currency)}</span>
              </p>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Controller
                control={control}
                name="bankAccountId"
                render={({ field }) => (
                  <Select
                    label={t("zakat.bank_account")}
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      if (key) field.onChange(key);
                    }}
                    variant="flat"
                    classNames={{
                      trigger: "bg-white dark:bg-content1 shadow-none border border-default-200",
                    }}
                  >
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id!}>{`${a.code} — ${a.name}`}</SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <AppDatePicker
                    label={t("zakat.payment_date")}
                    value={parseDate(field.value.toISOString().slice(0, 10))}
                    onChange={(d: { toString(): string } | null) => {
                      if (d) field.onChange(new Date(d.toString()));
                    }}
                  />
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("actions.cancel")}
              </Button>
              <Button color="success" type="submit" isLoading={recordPayment.isPending}>
                {t("zakat.payment_confirm")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}

export default function ZakatPage() {
  const { t, i18n } = useTranslation("billing");
  const calculation = useZakatCalculation();
  const currency = useZakatCurrency();
  const { data: records = [], isLoading } = useZakatRecords();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [payingRecord, setPayingRecord] = useState<ZakatRecord | null>(null);

  const dateLocale = i18n.language.startsWith("ar") ? "ar-SA" : undefined;

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <AccountingPageHeader
        title={t("zakat.title")}
        description={t("zakat.description")}
        breadcrumbItems={[{ label: t("module_name"), to: "/billing" }, { label: t("zakat.title") }]}
        action={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to="/billing/settings"
              variant="flat"
              startContent={<Settings className="h-4 w-4" />}
            >
              {t("zakat.configure_rate")}
            </Button>
            <Button color="primary" startContent={<HandCoins className="h-4 w-4" />} onPress={onOpen}>
              {t("zakat.accrue")}
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-default-200 bg-content1 px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Scale className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-default-500">{t("zakat.zakat_base")}</p>
            <p className="truncate text-base font-bold tabular-nums text-default-900" dir="ltr">
              {formatCurrency(calculation.zakatBase, currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-default-200 bg-content1 px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-default-500">{t("zakat.eligible_assets")}</p>
            <p className="truncate text-base font-bold tabular-nums text-default-900" dir="ltr">
              {formatCurrency(calculation.eligibleAssets, currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border-2 border-primary/30 bg-primary/[0.04] px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-default-500">
              {t("zakat.zakat_due")} ({calculation.configuredRatePercent}%)
            </p>
            <p className="truncate text-base font-bold tabular-nums text-primary" dir="ltr">
              {formatCurrency(calculation.zakatDue, currency)}
            </p>
          </div>
        </div>
      </div>

      <p className="mb-4 rounded-md border border-default-200 bg-default-50/60 px-3 py-2 text-xs leading-relaxed text-default-500 dark:bg-default-50/5">
        {t("zakat.formula_help")}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner color="primary" />
        </div>
      ) : (
        <ReportDataTable
          emptyMessage={t("zakat.empty")}
          columns={[
            { key: "fiscalYear", label: t("zakat.columns.fiscal_year") },
            { key: "periodEnd", label: t("zakat.columns.period_end") },
            { key: "zakatBase", label: t("zakat.columns.base"), align: "end" },
            { key: "zakatDue", label: t("zakat.columns.due"), align: "end" },
            { key: "status", label: t("zakat.columns.status") },
            { key: "actions", label: "" },
          ]}
          rows={records.map((record) => ({
            id: record.id!,
            cells: [
              record.fiscalYear,
              record.periodEnd.toLocaleDateString(dateLocale),
              formatCurrency(record.zakatBase, record.currency),
              formatCurrency(record.zakatDue, record.currency),
              <span
                key="status"
                className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-medium", statusColor(record.status))}
              >
                {t(`zakat.status.${record.status}`)}
              </span>,
              record.status === "accrued" ? (
                <Button key="pay" size="sm" variant="flat" color="primary" onPress={() => setPayingRecord(record)}>
                  {t("zakat.record_payment")}
                </Button>
              ) : null,
            ],
          }))}
        />
      )}

      <AccrueZakatModal isOpen={isOpen} onClose={onClose} />
      <RecordZakatPaymentModal record={payingRecord} onClose={() => setPayingRecord(null)} />
    </div>
  );
}
