import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Building2, Palette, RotateCcw, Save } from "lucide-react";
import {
  companyProfileSchema,
  type CompanyProfileFormValues,
} from "../schemas/company.schema";
import { useCompanyProfile, useUpdateCompanyProfileMutation } from "../hooks/use-company-profile";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { selectFieldProps } from "@/components/shared/select-field";
import { useAppPermissions } from "../hooks/use-app-permissions";
import { BRAND_PRIMARY_HEX, BRAND_SECONDARY_HEX } from "@/theme/brand-colors";

const CURRENCIES = ["USD", "EUR", "SAR", "AED", "EGP"];

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function ColorField({
  label,
  value,
  fallback,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const swatchValue = HEX_PATTERN.test(value) ? value : fallback;

  return (
    <div className="flex items-end gap-3">
      <label className="relative shrink-0 cursor-pointer">
        <span
          className="block h-10 w-10 rounded-lg border border-default-200 shadow-sm"
          style={{ backgroundColor: swatchValue }}
        />
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={label}
        />
      </label>
      <Input
        label={label}
        variant="bordered"
        dir="ltr"
        value={value}
        placeholder={fallback}
        isReadOnly={disabled}
        onValueChange={onChange}
        className="flex-1"
      />
    </div>
  );
}

interface CompanyProfileFormProps {
  readOnly?: boolean;
}

export function CompanyProfileForm({ readOnly }: CompanyProfileFormProps) {
  const { t } = useTranslation("settings");
  const { data: profile, isLoading } = useCompanyProfile();
  const updateProfile = useUpdateCompanyProfileMutation();
  // Separate mutation instance so its pending/loading state doesn't couple to
  // the main "Save" button below — saving colors shouldn't require the rest
  // of the company profile (e.g. commercial register) to be filled in/valid.
  const saveColors = useUpdateCompanyProfileMutation();
  const { canManageCompany } = useAppPermissions();
  const editable = canManageCompany && !readOnly;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      commercialRegister: "",
      taxNumber: "",
      legalName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      defaultCurrency: "USD",
      brandColor: "",
      brandSecondaryColor: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? "",
        nameAr: profile.nameAr ?? "",
        commercialRegister: profile.commercialRegister ?? "",
        taxNumber: profile.taxNumber ?? "",
        legalName: profile.legalName ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        city: profile.city ?? "",
        country: profile.country ?? "",
        defaultCurrency: profile.defaultCurrency ?? "USD",
        brandColor: profile.brandColor ?? "",
        brandSecondaryColor: profile.brandSecondaryColor ?? "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: CompanyProfileFormValues) => {
    await updateProfile.mutateAsync({
      ...values,
      email: values.email || undefined,
      brandColor: values.brandColor || undefined,
      brandSecondaryColor: values.brandSecondaryColor || undefined,
    });
  };

  // Saves only the brand colors — validates just those two fields and sends a
  // partial update, so it works even if other required company fields (e.g.
  // commercial register) are blank or invalid.
  const handleSaveColors = async () => {
    const valid = await trigger(["brandColor", "brandSecondaryColor"]);
    if (!valid) return;
    const { brandColor, brandSecondaryColor } = getValues();
    await saveColors.mutateAsync({
      brandColor: brandColor || undefined,
      brandSecondaryColor: brandSecondaryColor || undefined,
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card className="border border-default-100 shadow-sm rounded-2xl">
      <CardHeader className="flex items-center gap-2 px-6 pt-6 pb-0">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-bold text-lg">{t("company.title")}</h2>
          <p className="text-xs text-default-500">{t("company.subtitle")}</p>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("company.fields.name")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("name")}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message}
            />
            <Input
              label={t("company.fields.nameAr")}
              variant="bordered"
              dir="rtl"
              isReadOnly={!editable}
              {...register("nameAr")}
            />
            <Input
              label={t("company.fields.commercialRegister")}
              variant="bordered"
              isRequired
              isReadOnly={!editable}
              description={t("company.fields.commercialRegisterHint")}
              {...register("commercialRegister")}
              isInvalid={!!errors.commercialRegister}
              errorMessage={errors.commercialRegister?.message}
              className="md:col-span-2"
            />
            <Input
              label={t("company.fields.taxNumber")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("taxNumber")}
            />
            <Input
              label={t("company.fields.legalName")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("legalName")}
            />
            <Input
              label={t("company.fields.email")}
              variant="bordered"
              type="email"
              isReadOnly={!editable}
              {...register("email")}
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
            />
            <Input
              label={t("company.fields.phone")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("phone")}
            />
            <Input
              label={t("company.fields.address")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("address")}
              className="md:col-span-2"
            />
            <Input
              label={t("company.fields.city")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("city")}
            />
            <Input
              label={t("company.fields.country")}
              variant="bordered"
              isReadOnly={!editable}
              {...register("country")}
            />
            <Controller
              name="defaultCurrency"
              control={control}
              render={({ field }) => (
                <Select
                  {...selectFieldProps()}
                  label={t("company.fields.defaultCurrency")}
                  variant="bordered"
                  selectedKeys={new Set([field.value])}
                  isDisabled={!editable}
                  onSelectionChange={(keys) => {
                    const v = Array.from(keys)[0] as string;
                    if (v) field.onChange(v);
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} textValue={c}>{c}</SelectItem>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="border-t border-default-100 pt-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-sm font-bold">{t("company.branding.title")}</h3>
                  <p className="text-xs text-default-500">{t("company.branding.subtitle")}</p>
                </div>
              </div>
              {editable && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="light"
                    startContent={<RotateCcw className="h-3.5 w-3.5" />}
                    onPress={() => {
                      setValue("brandColor", "", { shouldDirty: true });
                      setValue("brandSecondaryColor", "", { shouldDirty: true });
                    }}
                  >
                    {t("company.branding.reset")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Save className="h-3.5 w-3.5" />}
                    isLoading={saveColors.isPending}
                    onPress={handleSaveColors}
                  >
                    {t("company.branding.save")}
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="brandColor"
                control={control}
                render={({ field }) => (
                  <ColorField
                    label={t("company.branding.primary")}
                    value={field.value ?? ""}
                    fallback={BRAND_PRIMARY_HEX}
                    onChange={field.onChange}
                    disabled={!editable}
                  />
                )}
              />
              <Controller
                name="brandSecondaryColor"
                control={control}
                render={({ field }) => (
                  <ColorField
                    label={t("company.branding.secondary")}
                    value={field.value ?? ""}
                    fallback={BRAND_SECONDARY_HEX}
                    onChange={field.onChange}
                    disabled={!editable}
                  />
                )}
              />
            </div>
          </div>

          {editable && (
            <Button
              type="submit"
              color="primary"
              className="rounded-full font-bold"
              startContent={<Save className="h-4 w-4" />}
              isLoading={isSubmitting || updateProfile.isPending}
            >
              {t("company.save")}
            </Button>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
