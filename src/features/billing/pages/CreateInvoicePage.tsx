import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  Textarea,
} from "@heroui/react";
import { Plus, Trash2, Save, Send, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

import { selectFieldProps } from "@/components/shared/select-field";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import { useProducts } from "../hooks/use-products";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { useCreateInvoiceMutation, useUpdateInvoiceMutation, useInvoice } from "../hooks/use-invoices";
import { invoiceSchema, type CreateInvoiceDTO } from "../schemas/invoice";
import { quotationDataToInvoiceForm } from "../utils/accounting-engine";
import { BillingMoney } from "../components/BillingMoney";
import { LineTaxRateSelect } from "../components/LineTaxRateSelect";
import {
  getDefaultTax,
  getTaxRateForProduct,
} from "../utils/tax-utils";
import {
  DEFAULT_BILLING_CURRENCY,
  getDefaultBillingCurrency,
} from "../utils/billing-currency";

export default function CreateInvoicePage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const location = useLocation();
  const fromQuotation = (location.state as { fromQuotation?: {
    quotationId?: string;
    contactId: string;
    data: {
      currency: string;
      vatRate: number;
      pricesIncludeVat: boolean;
      notes?: string;
      validityMonths: number;
      items: Array<{
        nameAr?: string;
        nameEn?: string;
        description?: string;
        quantity: number;
        unitPrice: number;
      }>;
    };
  } })?.fromQuotation;

  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data || [];
  
  const { data: products = [] } = useProducts();
  const { data: billingSettings } = useBillingSettings();
  const taxes = billingSettings?.taxes ?? [];
  const defaultTax = getDefaultTax(taxes);
  
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { data: existingInvoice, isLoading: isLoadingExisting } = useInvoice(id);

  const createInvoice = useCreateInvoiceMutation();
  const updateInvoice = useUpdateInvoiceMutation();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceDTO>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      invoiceNumber: "DRAFT",
      status: "draft",
      currency: DEFAULT_BILLING_CURRENCY,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: [{
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        taxRateId: null,
        discount: 0,
        total: 0,
      }],
      subTotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      grandTotal: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (!isEditing && fromQuotation?.contactId && fromQuotation.data) {
      const draft = quotationDataToInvoiceForm({
        customerId: fromQuotation.contactId,
        quotationId: fromQuotation.quotationId,
        currency: fromQuotation.data.currency,
        vatRate: fromQuotation.data.vatRate,
        pricesIncludeVat: fromQuotation.data.pricesIncludeVat,
        notes: fromQuotation.data.notes,
        validityMonths: fromQuotation.data.validityMonths,
        items: fromQuotation.data.items,
      });
      control._reset(draft as any);
    }
  }, [isEditing, fromQuotation, control]);

  useEffect(() => {
    if (isEditing && existingInvoice) {
      const resetData = {
        ...existingInvoice,
        issueDate: new Date(existingInvoice.issueDate),
        dueDate: new Date(existingInvoice.dueDate),
      };
      // Type assertion is safe here as existingInvoice items map to the CreateInvoiceDTO
      control._reset(resetData as any);
    }
  }, [isEditing, existingInvoice, control]);

  useEffect(() => {
    if (!isEditing && !fromQuotation && billingSettings) {
      setValue("currency", getDefaultBillingCurrency(billingSettings));
    }
  }, [billingSettings, fromQuotation, isEditing, setValue]);

  useEffect(() => {
    if (isEditing || fromQuotation || !defaultTax) return;
    const items = watch("items");
    if (
      items?.length === 1 &&
      !items[0]?.taxRateId &&
      (items[0]?.taxRate ?? 0) === 0
    ) {
      setValue("items.0.taxRateId", defaultTax.id);
      setValue("items.0.taxRate", defaultTax.rate);
    }
  }, [defaultTax, fromQuotation, isEditing, setValue, watch]);

  const watchItems = watch("items");
  const currency = watch("currency") ?? DEFAULT_BILLING_CURRENCY;

  // Dynamic calculations
  // Dynamic calculations
  // We compute totals dynamically from watchItems.
  const subTotal = watchItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const totalDiscount = watchItems.reduce((acc, item) => acc + (Number(item.discount) || 0), 0);
  const totalTax = watchItems.reduce((acc, item) => {
    const q = Number(item.quantity) || 0;
    const r = Number(item.unitPrice) || 0;
    const d = Number(item.discount) || 0;
    const tx = Number(item.taxRate) || 0;
    const beforeTax = (q * r) - d;
    return acc + (beforeTax * (tx / 100));
  }, 0);
  const grandTotal = subTotal - totalDiscount + totalTax;

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
      setValue(`items.${index}.productId`, product.id ?? null);
      const rate = getTaxRateForProduct(taxes, product.taxRateId);
      const tax =
        taxes.find((tx) => tx.id === product.taxRateId) ?? defaultTax ?? null;
      setValue(`items.${index}.taxRateId`, tax?.id ?? null);
      setValue(`items.${index}.taxRate`, rate);
    }
  };

  const appendLine = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: defaultTax?.rate ?? 0,
      taxRateId: defaultTax?.id ?? null,
      discount: 0,
      total: 0,
    });
  };

  const onSubmit = async (data: CreateInvoiceDTO, actionType: "draft" | "sent") => {
    try {
      const finalData: CreateInvoiceDTO = {
        ...data,
        status: actionType,
        subTotal,
        totalTax,
        totalDiscount,
        grandTotal,
        items: watchItems.map((item, index) => {
          const q = Number(item.quantity) || 0;
          const r = Number(item.unitPrice) || 0;
          const d = Number(item.discount) || 0;
          const tx = Number(item.taxRate) || 0;
          const beforeTax = q * r - d;
          return {
            ...data.items[index],
            ...item,
            total: beforeTax + beforeTax * (tx / 100),
          };
        }),
      };
      if (isEditing && id) {
        await updateInvoice.mutateAsync({ id, data: finalData });
        toast.success(
          actionType === "sent"
            ? t("invoices.create.sent")
            : t("invoices.create.updated")
        );
      } else {
        await createInvoice.mutateAsync(finalData);
        toast.success(
          actionType === "sent"
            ? t("invoices.create.sent")
            : t("invoices.create.draft_saved")
        );
      }
      navigate("/billing/invoices");
    } catch {
      toast.error(t("invoices.create.save_failed"));
    }
  };

  if (isEditing && isLoadingExisting) {
    return (
      <div className="p-8 text-center animate-pulse">
        {t("invoices.create.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <nav className="flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <Link to="/billing/invoices" className="hover:text-primary">
          {t("invoices.title")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">
          {isEditing ? t("invoices.create.edit_title") : t("invoices.create.title")}
        </span>
      </nav>

      <p className="text-sm text-default-500">{t("invoices.create.subtitle")}</p>

      <form className="space-y-6">
        <Card className="p-2 border border-default-100 shadow-sm rounded-2xl">
          <CardBody className="gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <Controller
                control={control}
                name="customerId"
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    {...field}
                    label={t("invoices.create.customer") || "Customer"}
                    placeholder={t("invoices.create.customer_placeholder") || "Select a customer"}
                    variant="bordered"
                    isInvalid={!!errors.customerId}
                    errorMessage={(errors.customerId?.message as string)}
                  >
                    {contacts.map((contact) => {
                      const label = contactDisplayName(contact);
                      return (
                      <SelectItem key={contact.id} textValue={label}>
                        {label}
                      </SelectItem>
                      );
                    })}
                  </Select>
                )}
              />

              <Input
                label={t("invoices.create.invoice_number") || "Invoice Number"}
                variant="bordered"
                isReadOnly
                {...register("invoiceNumber")}
                description={t("invoices.create.number_assigned_on_post") || "Assigned when posted"}
              />

            </div>
          </CardBody>
        </Card>

        {/* Items Table */}
        <Card className="border border-default-100 shadow-sm rounded-2xl">
          <CardHeader className="px-6 py-4 flex justify-between items-center bg-default-50/50">
            <h3 className="font-bold text-lg">{t("invoices.create.item_details") || "Item Details"}</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px] text-start">
              <thead className="bg-default-100/50 text-sm font-medium text-default-600">
                <tr>
                  <th className="p-4 w-[30%]">{t("invoices.create.product_item") || "Product / Item"}</th>
                  <th className="p-4 w-[15%]">{t("invoices.create.quantity") || "Quantity"}</th>
                  <th className="p-4 w-[15%]">{t("invoices.create.rate") || "Rate"}</th>
                  <th className="p-4 w-[15%]">{t("invoices.create.tax")}</th>
                  <th className="p-4 w-[15%] text-end">{t("invoices.create.amount")}</th>
                  <th className="p-4 w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const q = Number(watch(`items.${index}.quantity`)) || 0;
                  const r = Number(watch(`items.${index}.unitPrice`)) || 0;
                  const d = Number(watch(`items.${index}.discount`)) || 0;
                  const tx = Number(watch(`items.${index}.taxRate`)) || 0;
                  const amtBeforeTax = (q * r) - d;
                  const lineTotal = amtBeforeTax + (amtBeforeTax * (tx / 100));

                  return (
                    <tr key={field.id} className="border-b border-default-100 group">
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <Select
                            {...selectFieldProps({ compact: true })}
                            size="sm"
                            aria-label="Select Product"
                            placeholder={t("invoices.create.select_product") || "Select Product..."}
                            variant="flat"
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                          >
                            {products.map((p) => (
                              <SelectItem key={p.id} textValue={p.name}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </Select>
                          <Input
                            size="sm"
                            placeholder={t("invoices.create.item_description") || "Item description..."}
                            variant="flat"
                            {...register(`items.${index}.description` as const)}
                            isInvalid={!!errors.items?.[index]?.description}
                          />
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <Input
                          size="sm"
                          type="number"
                          variant="flat"
                          {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="p-4 align-top">
                        <Input
                          size="sm"
                          type="number"
                          variant="flat"
                          dir="ltr"
                          classNames={{ input: "text-start" }}
                          startContent={<span className="text-default-400 text-xs">$</span>}
                          {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="p-4 align-top">
                        <LineTaxRateSelect
                          taxes={taxes}
                          taxRateId={watch(`items.${index}.taxRateId`)}
                          onChange={(tax) => {
                            setValue(`items.${index}.taxRateId`, tax?.id ?? null);
                            setValue(`items.${index}.taxRate`, tax?.rate ?? 0);
                          }}
                        />
                      </td>
                      <td className="p-4 align-top text-end font-medium text-default-700">
                        <BillingMoney amount={lineTotal} currency={currency} />
                      </td>
                      <td className="p-4 align-top text-end">
                        <Button
                          isIconOnly
                          variant="light"
                          color="danger"
                          size="sm"
                          onPress={() => remove(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="p-4">
              <Button
                variant="flat"
                color="primary"
                size="sm"
                startContent={<Plus className="w-4 h-4" />}
                onPress={appendLine}
              >
                {t("invoices.create.add_line") || "Add another line"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="w-full md:w-1/2 space-y-4">
             <Textarea
               label={t("invoices.create.notes") || "Customer Notes"}
               placeholder={t("invoices.create.notes_placeholder") || "Thanks for your business."}
               variant="bordered"
               {...register("notes")}
             />
             <Textarea
               label={t("invoices.create.terms") || "Terms & Conditions"}
               placeholder={t("invoices.create.terms_placeholder") || "Payment due in 15 days."}
               variant="bordered"
               {...register("termsAndConditions")}
             />
          </div>

          <Card className="w-full md:w-1/3 border border-default-100 shadow-sm rounded-2xl bg-default-50/50">
            <CardBody className="p-6 space-y-4">
              <div className="flex justify-between text-sm text-default-600">
                <span>{t("invoices.create.sub_total")}</span>
                <BillingMoney amount={subTotal} currency={currency} className="font-medium" />
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-danger">
                  <span>{t("invoices.create.discount")}</span>
                  <BillingMoney amount={-totalDiscount} currency={currency} />
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-sm text-default-600">
                  <span>{t("invoices.create.total_tax")}</span>
                  <BillingMoney amount={totalTax} currency={currency} className="font-medium" />
                </div>
              )}
              <Divider />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("invoices.create.total")}</span>
                <BillingMoney amount={grandTotal} currency={currency} />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-default-100 shadow-xl z-10">
          <Button
            variant="flat"
            onPress={() => handleSubmit((data) => onSubmit(data as any, "draft"))()}
            isLoading={isSubmitting || updateInvoice.isPending || createInvoice.isPending}
            startContent={<Save className="w-4 h-4" />}
          >
            {isEditing ? t("invoices.create.update_draft") : t("invoices.create.save_draft")}
          </Button>
          <Button
            color="primary"
            onPress={() => handleSubmit((data) => onSubmit(data as any, "sent"))()}
            isLoading={isSubmitting || updateInvoice.isPending || createInvoice.isPending}
            startContent={<Send className="w-4 h-4" />}
          >
            {isEditing ? t("invoices.create.update_send") : t("invoices.create.save_send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
