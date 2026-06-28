import { useEffect } from "react";
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
  Switch,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  productSchema,
  type Product,
} from "../schemas/product";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useProductCategories,
  useProductUnits,
} from "../hooks/use-products";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { selectFieldProps } from "@/components/shared/select-field";
import {
  categoryLabel,
  taxOptionLabel,
  unitLabel,
} from "../utils/product-labels";
import { getActiveTaxes } from "../utils/tax-utils";

interface ProductFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormModal({ isOpen, onOpenChange, product }: ProductFormModalProps) {
  const { t } = useTranslation("billing");
  const { t: tc } = useTranslation("common");

  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories();
  const { data: units = [], isLoading: unitsLoading } = useProductUnits();
  const { data: settings, isLoading: settingsLoading } = useBillingSettings();

  const taxes = getActiveTaxes(settings?.taxes ?? []);
  const catalogLoading = categoriesLoading || unitsLoading || settingsLoading;

  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(productSchema.omit({ id: true, createdAt: true, updatedAt: true })),
    defaultValues: {
      type: "goods",
      name: "",
      sku: "",
      description: "",
      price: 0,
      categoryId: null,
      unitId: null,
      taxRateId: null,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      reset({
        type: product.type,
        name: product.name,
        sku: product.sku ?? "",
        description: product.description ?? "",
        price: product.price,
        categoryId: product.categoryId ?? null,
        unitId: product.unitId ?? null,
        taxRateId: product.taxRateId ?? null,
        isActive: product.isActive ?? true,
      });
    } else {
      reset({
        type: "goods",
        name: "",
        sku: "",
        description: "",
        price: 0,
        categoryId: null,
        unitId: null,
        taxRateId: null,
        isActive: true,
      });
    }
  }, [isOpen, product, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit && product?.id) {
        await updateProduct.mutateAsync({ id: product.id, data });
      } else {
        await createProduct.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  const busy = isSubmitting || createProduct.isPending || updateProduct.isPending;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isEdit ? t("products.form.edit_title") : t("products.form.add_title")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("products.form.type")}
                      selectedKeys={new Set([field.value])}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as "goods" | "service";
                        field.onChange(val);
                      }}
                      variant="bordered"
                    >
                      <SelectItem key="goods" textValue={t("products.types.goods")}>{t("products.types.goods")}</SelectItem>
                      <SelectItem key="service" textValue={t("products.types.service")}>{t("products.types.service")}</SelectItem>
                    </Select>
                  )}
                />
                <Input
                  label={t("products.form.name")}
                  {...register("name")}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message as string}
                  variant="bordered"
                  isRequired
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("products.form.sku")}
                  {...register("sku")}
                  isInvalid={!!errors.sku}
                  errorMessage={errors.sku?.message as string}
                  variant="bordered"
                />
                <Input
                  label={t("products.form.price")}
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  isInvalid={!!errors.price}
                  errorMessage={errors.price?.message as string}
                  variant="bordered"
                  isRequired
                  dir="ltr"
                  classNames={{ input: "text-start" }}
                  startContent={
                    <span className="text-default-400 text-sm">$</span>
                  }
                />
              </div>

              <Textarea
                label={t("products.form.description")}
                {...register("description")}
                isInvalid={!!errors.description}
                errorMessage={errors.description?.message as string}
                variant="bordered"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("products.form.category")}
                      placeholder={t("products.form.category_placeholder")}
                      isLoading={categoriesLoading}
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val || null);
                      }}
                      variant="bordered"
                      items={categories}
                    >
                      {(c) => (
                        <SelectItem
                          key={c.id!}
                          textValue={categoryLabel(t, c.name)}
                        >
                          {categoryLabel(t, c.name)}
                        </SelectItem>
                      )}
                    </Select>
                  )}
                />
                <Controller
                  name="unitId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("products.form.unit")}
                      placeholder={t("products.form.unit_placeholder")}
                      isLoading={unitsLoading}
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val || null);
                      }}
                      variant="bordered"
                      items={units}
                    >
                      {(u) => {
                        const label = unitLabel(t, u.name);
                        const withAbbr = u.abbreviation
                          ? `${label} (${u.abbreviation})`
                          : label;
                        return (
                          <SelectItem key={u.id!} textValue={withAbbr}>
                            {withAbbr}
                          </SelectItem>
                        );
                      }}
                    </Select>
                  )}
                />
                <Controller
                  name="taxRateId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...selectFieldProps()}
                      label={t("products.form.tax_rate")}
                      placeholder={t("products.form.tax_placeholder")}
                      isLoading={settingsLoading}
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val || null);
                      }}
                      variant="bordered"
                      items={taxes}
                    >
                      {(tax) => (
                        <SelectItem
                          key={tax.id}
                          textValue={taxOptionLabel(t, tax)}
                        >
                          {taxOptionLabel(t, tax)}
                        </SelectItem>
                      )}
                    </Select>
                  )}
                />
              </div>

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    isSelected={field.value}
                    onValueChange={field.onChange}
                    size="sm"
                  >
                    {t("products.form.is_active")}
                  </Switch>
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {tc("actions.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={busy || catalogLoading}>
                {isEdit ? tc("actions.save") : tc("actions.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
