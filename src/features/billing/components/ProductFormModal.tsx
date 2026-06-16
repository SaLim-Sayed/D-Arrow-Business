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
  
  const { data: categories = [] } = useProductCategories();
  const { data: units = [] } = useProductUnits();
  const { data: settings } = useBillingSettings();

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
                      label={t("products.form.type")}
                      selectedKeys={new Set([field.value])}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as "goods" | "service";
                        field.onChange(val);
                      }}
                      variant="bordered"
                    >
                      <SelectItem key="goods">{t("products.types.goods")}</SelectItem>
                      <SelectItem key="service">{t("products.types.service")}</SelectItem>
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
                      label={t("products.form.category")}
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val || null);
                      }}
                      variant="bordered"
                    >
                      {categories.map((c: any) => (
                        <SelectItem key={c.id}>{c.name}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  name="unitId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("products.form.unit")}
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val || null);
                      }}
                      variant="bordered"
                    >
                      {units.map((u: any) => (
                        <SelectItem key={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  name="taxRateId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t("products.form.tax_rate")}
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val || null);
                      }}
                      variant="bordered"
                    >
                      {(settings?.taxes || []).map((t: any) => (
                        <SelectItem key={t.id}>{t.name} ({t.rate}%)</SelectItem>
                      ))}
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
              <Button color="primary" type="submit" isLoading={busy}>
                {isEdit ? tc("actions.save") : tc("actions.create")}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
