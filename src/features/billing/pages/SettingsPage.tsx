import { useEffect, useState } from "react";
import { Button, Input, Spinner } from "@heroui/react";
import {
  Building2,
  Hash,
  Save,
  Settings2,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { billingSettingsSchema } from "../schemas/settings";
import { useSeedBillingDataMutation } from "../hooks/use-seed-billing";
import {
  useBillingSettings,
  useUpdateBillingSettingsMutation,
} from "../hooks/use-billing-settings";
import { TaxRatesEditor } from "../components/TaxRatesEditor";
import { normalizeTaxesForSave } from "../utils/tax-utils";
import { ReportPageHeader } from "../components/report-ui";

type SettingsTab = "general" | "financial" | "advanced";

const TAB_CONFIG: {
  key: SettingsTab;
  icon: React.ElementType;
  labelKey: string;
}[] = [
  { key: "general", icon: Building2, labelKey: "settings.tab_general" },
  { key: "financial", icon: Wallet, labelKey: "settings.tab_financial" },
  { key: "advanced", icon: ShieldAlert, labelKey: "settings.tab_advanced" },
];

const inputClassNames = {
  inputWrapper:
    "bg-white dark:bg-content1 shadow-none border border-default-200",
};

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-default-200 bg-content1">
      <div className="border-b border-default-200 bg-default-50/90 px-4 py-3">
        <h3 className="text-sm font-bold text-default-800">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-default-500">{description}</p>
        )}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation("billing");
  const { t: tc } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const seedMutation = useSeedBillingDataMutation();
  const { data: settings, isLoading } = useBillingSettings();
  const updateSettings = useUpdateBillingSettingsMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<any>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: {
      companyProfile: {
        name: "",
        address: "",
        email: "",
      },
      invoiceSequence: {
        prefix: "INV-",
        nextNumber: 1,
        padding: 4,
      },
      currencies: [
        { code: "USD", symbol: "$", name: "US Dollar", isDefault: true },
      ],
      taxes: [],
      paymentMethods: [],
    },
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({
    control,
    name: "taxes",
  });

  const sequencePrefix = watch("invoiceSequence.prefix") ?? "INV-";
  const sequenceNext = watch("invoiceSequence.nextNumber") ?? 1;
  const sequencePadding = watch("invoiceSequence.padding") ?? 4;
  const sequencePreview = `${sequencePrefix}${String(sequenceNext).padStart(
    Math.max(1, Number(sequencePadding) || 1),
    "0"
  )}`;

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        taxes: normalizeTaxesForSave(data.taxes ?? []),
      };
      await updateSettings.mutateAsync(payload);
      toast.success(t("settings.saved_successfully"));
    } catch {
      toast.error(tc("errors.somethingWentWrong"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-24 duration-300">
      <ReportPageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-hidden rounded-lg border border-default-200 bg-content1 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-default-200 bg-default-50/90 px-3 py-2">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TAB_CONFIG.map(({ key, icon: Icon, labelKey }) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-content1 text-default-600 hover:bg-default-100 dark:bg-content1"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
            <Button
              type="submit"
              size="sm"
              color="primary"
              className="shrink-0 font-semibold"
              startContent={<Save className="h-4 w-4" />}
              isLoading={isSubmitting || updateSettings.isPending}
            >
              {tc("actions.save")}
            </Button>
          </div>

          <div className="space-y-4 p-4 md:p-5">
            {activeTab === "general" && (
              <>
                <SettingsSection title={t("settings.company_profile")}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      size="sm"
                      label={t("settings.company_name")}
                      placeholder={t("settings.placeholders.company_name")}
                      {...register("companyProfile.name")}
                      isInvalid={!!(errors?.companyProfile as any)?.name}
                      errorMessage={(errors?.companyProfile as any)?.name?.message}
                      variant="flat"
                      classNames={inputClassNames}
                    />
                    <Input
                      size="sm"
                      label={t("settings.tax_number")}
                      placeholder={t("settings.placeholders.tax_number")}
                      {...register("companyProfile.taxNumber")}
                      variant="flat"
                      classNames={inputClassNames}
                    />
                  </div>
                  <Input
                    size="sm"
                    label={t("settings.address")}
                    placeholder={t("settings.placeholders.address")}
                    {...register("companyProfile.address")}
                    isInvalid={!!(errors?.companyProfile as any)?.address}
                    errorMessage={(errors?.companyProfile as any)?.address?.message}
                    variant="flat"
                    classNames={inputClassNames}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      size="sm"
                      label={t("settings.email")}
                      type="email"
                      placeholder={t("settings.placeholders.email")}
                      {...register("companyProfile.email")}
                      isInvalid={!!(errors?.companyProfile as any)?.email}
                      errorMessage={(errors?.companyProfile as any)?.email?.message}
                      variant="flat"
                      classNames={inputClassNames}
                    />
                    <Input
                      size="sm"
                      label={t("settings.phone")}
                      placeholder={t("settings.placeholders.phone")}
                      {...register("companyProfile.phone")}
                      variant="flat"
                      classNames={inputClassNames}
                      dir="ltr"
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title={t("settings.invoice_sequence")}
                  description={t("settings.sequence_help")}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      size="sm"
                      label={t("settings.prefix")}
                      placeholder={t("settings.placeholders.prefix")}
                      {...register("invoiceSequence.prefix")}
                      variant="flat"
                      classNames={inputClassNames}
                      dir="ltr"
                    />
                    <Input
                      size="sm"
                      label={t("settings.next_number")}
                      type="number"
                      {...register("invoiceSequence.nextNumber", {
                        valueAsNumber: true,
                      })}
                      variant="flat"
                      classNames={inputClassNames}
                      dir="ltr"
                    />
                    <Input
                      size="sm"
                      label={t("settings.padding")}
                      type="number"
                      placeholder={t("settings.placeholders.padding")}
                      {...register("invoiceSequence.padding", {
                        valueAsNumber: true,
                      })}
                      variant="flat"
                      classNames={inputClassNames}
                      dir="ltr"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.04] px-3 py-2 text-sm">
                    <Hash className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-default-600">{t("settings.sequence_preview")}:</span>
                    <span className="font-mono font-bold text-primary" dir="ltr">
                      {sequencePreview}
                    </span>
                  </div>
                </SettingsSection>
              </>
            )}

            {activeTab === "financial" && (
              <div className="space-y-3">
                <p className="text-xs text-default-500">{t("settings.financial_desc")}</p>
                <TaxRatesEditor
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  taxFields={taxFields}
                  appendTax={appendTax}
                  removeTax={removeTax}
                />
              </div>
            )}

            {activeTab === "advanced" && (
              <SettingsSection
                title={t("settings.developer_actions")}
                description={t("settings.seed_desc")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Settings2 className="h-5 w-5 text-danger" />
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={() => seedMutation.mutate()}
                    isLoading={seedMutation.isPending}
                  >
                    {t("settings.seed_button")}
                  </Button>
                </div>
              </SettingsSection>
            )}
          </div>

          {isDirty && (
            <div className="border-t border-default-200 bg-default-50/60 px-4 py-2 text-xs text-default-500">
              {t("settings.unsaved_hint")}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
