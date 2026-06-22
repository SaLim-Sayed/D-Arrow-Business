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
import { Building2, Save } from "lucide-react";
import {
  companyProfileSchema,
  type CompanyProfileFormValues,
} from "../schemas/company.schema";
import { useCompanyProfile, useUpdateCompanyProfileMutation } from "../hooks/use-company-profile";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { selectFieldProps } from "@/components/shared/select-field";
import { useAppPermissions } from "../hooks/use-app-permissions";

const CURRENCIES = ["USD", "EUR", "SAR", "AED", "EGP"];

interface CompanyProfileFormProps {
  readOnly?: boolean;
}

export function CompanyProfileForm({ readOnly }: CompanyProfileFormProps) {
  const { t } = useTranslation("settings");
  const { data: profile, isLoading } = useCompanyProfile();
  const updateProfile = useUpdateCompanyProfileMutation();
  const { canManageCompany } = useAppPermissions();
  const editable = canManageCompany && !readOnly;

  const {
    register,
    handleSubmit,
    control,
    reset,
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
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: CompanyProfileFormValues) => {
    await updateProfile.mutateAsync({
      ...values,
      email: values.email || undefined,
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
