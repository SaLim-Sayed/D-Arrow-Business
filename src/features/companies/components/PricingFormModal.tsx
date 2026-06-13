import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Textarea,
} from "@heroui/react";
import {
  pricingFormSchema,
  type PricingFormValues,
} from "../schemas/pricing.schema";
import type { ProductPrice } from "../types/pricing.types";
import { useCompanyProfile } from "../hooks/use-company-profile";
import { useCreatePriceMutation, useUpdatePriceMutation } from "../hooks/use-pricing";
import { normalizeCurrencyCode } from "@/lib/utils";

interface PricingFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  price?: ProductPrice | null;
}

export function PricingFormModal({
  isOpen,
  onOpenChange,
  price,
}: PricingFormModalProps) {
  const { t } = useTranslation("settings");
  const { data: company } = useCompanyProfile();
  const createPrice = useCreatePriceMutation();
  const updatePrice = useUpdatePriceMutation();
  const isEdit = !!price;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      sku: "",
      description: "",
      unitPrice: 0,
      currency: company?.defaultCurrency ?? "USD",
      taxRate: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        price
          ? {
              name: price.name,
              nameAr: price.nameAr ?? "",
              sku: price.sku ?? "",
              description: price.description ?? "",
              unitPrice: price.unitPrice,
              currency: price.currency,
              taxRate: price.taxRate ?? 0,
              status: price.status,
            }
          : {
              name: "",
              nameAr: "",
              sku: "",
              description: "",
              unitPrice: 0,
              currency: company?.defaultCurrency ?? "USD",
              taxRate: 0,
              status: "active",
            }
      );
    }
  }, [isOpen, price, company, reset]);

  const onSubmit = async (values: PricingFormValues) => {
    const payload = {
      ...values,
      currency: normalizeCurrencyCode(values.currency),
      commercialRegisterRef: company?.commercialRegister || undefined,
      taxRate: values.taxRate || undefined,
      nameAr: values.nameAr || undefined,
      sku: values.sku || undefined,
      description: values.description || undefined,
    };

    if (isEdit && price) {
      await updatePrice.mutateAsync({ id: price.id, data: payload });
    } else {
      await createPrice.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("pricing.editTitle") : t("pricing.createTitle")}
            </ModalHeader>
            <ModalBody className="gap-4">
              {company?.commercialRegister && (
                <p className="text-xs text-default-500 rounded-xl bg-default-50 p-3">
                  {t("pricing.linkedCr", { cr: company.commercialRegister })}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("pricing.fields.name")}
                  variant="bordered"
                  {...register("name")}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
                <Input
                  label={t("pricing.fields.nameAr")}
                  variant="bordered"
                  dir="rtl"
                  {...register("nameAr")}
                />
                <Input
                  label={t("pricing.fields.sku")}
                  variant="bordered"
                  {...register("sku")}
                />
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("pricing.fields.status")}
                      variant="bordered"
                      selectedKeys={new Set([field.value])}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as PricingFormValues["status"];
                        if (v) field.onChange(v);
                      }}
                    >
                      <SelectItem key="active">{t("pricing.status.active")}</SelectItem>
                      <SelectItem key="inactive">{t("pricing.status.inactive")}</SelectItem>
                    </Select>
                  )}
                />
                <Input
                  label={t("pricing.fields.unitPrice")}
                  variant="bordered"
                  type="number"
                  step="0.01"
                  {...register("unitPrice")}
                  isInvalid={!!errors.unitPrice}
                  errorMessage={errors.unitPrice?.message}
                />
                <Input
                  label={t("pricing.fields.currency")}
                  variant="bordered"
                  maxLength={3}
                  {...register("currency")}
                  isInvalid={!!errors.currency}
                  errorMessage={errors.currency?.message}
                />
                <Input
                  label={t("pricing.fields.taxRate")}
                  variant="bordered"
                  type="number"
                  step="0.1"
                  {...register("taxRate")}
                  endContent="%"
                />
                <Textarea
                  label={t("pricing.fields.description")}
                  variant="bordered"
                  className="md:col-span-2"
                  {...register("description")}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {t("common:actions.cancel")}
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isSubmitting || createPrice.isPending || updatePrice.isPending}
              >
                {t("pricing.save")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
