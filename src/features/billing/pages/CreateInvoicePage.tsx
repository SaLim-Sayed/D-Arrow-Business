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
import { Plus, Trash2, Save, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { selectFieldProps } from "@/components/shared/select-field";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { useProducts } from "../hooks/use-products";
import { useCreateInvoiceMutation, useUpdateInvoiceMutation, useInvoice } from "../hooks/use-invoices";
import { invoiceSchema, type CreateInvoiceDTO } from "../schemas/invoice";
import { formatCurrency } from "@/lib/utils";

export default function CreateInvoicePage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();

  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data || [];
  
  const { data: products = [] } = useProducts();
  
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
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "draft",
      currency: "USD",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0, total: 0 }],
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

  const watchItems = watch("items");

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
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };

  const onSubmit = async (data: CreateInvoiceDTO, actionType: "draft" | "sent") => {
    try {
      const finalData = { ...data, status: actionType };
      if (isEditing && id) {
        await updateInvoice.mutateAsync({ id, data: finalData });
        toast.success(actionType === "sent" ? "Invoice sent!" : "Invoice updated");
      } else {
        await createInvoice.mutateAsync(finalData);
        toast.success(actionType === "sent" ? "Invoice sent!" : "Draft saved");
      }
      navigate("/billing/invoices");
    } catch (error) {
      toast.error("Failed to save invoice");
    }
  };

  if (isEditing && isLoadingExisting) {
    return <div className="p-8 text-center animate-pulse">Loading invoice...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      <PageHeader
        title={isEditing ? "Edit Invoice" : (t("invoices.create.title") || "New Invoice")}
        description={isEditing ? "Update invoice details." : (t("invoices.create.description") || "Create a new sales invoice for your customer.")}
      />

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
                      const label = `${contact.firstName} ${contact.lastName}`;
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
                {...register("invoiceNumber")}
                isInvalid={!!errors.invoiceNumber}
                errorMessage={(errors.invoiceNumber?.message as string)}
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
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-default-100/50 text-sm font-medium text-default-600">
                <tr>
                  <th className="p-4 w-[30%]">{t("invoices.create.product_item") || "Product / Item"}</th>
                  <th className="p-4 w-[15%]">{t("invoices.create.quantity") || "Quantity"}</th>
                  <th className="p-4 w-[15%]">{t("invoices.create.rate") || "Rate"}</th>
                  <th className="p-4 w-[15%]">{t("invoices.create.tax") || "Tax (%)"}</th>
                  <th className="p-4 w-[15%] text-right">{t("invoices.create.amount") || "Amount"}</th>
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
                          startContent={<span className="text-default-400 text-xs">$</span>}
                          {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="p-4 align-top">
                         <Input
                          size="sm"
                          type="number"
                          variant="flat"
                          endContent={<span className="text-default-400 text-xs">%</span>}
                          {...register(`items.${index}.taxRate` as const, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="p-4 align-top text-right font-medium text-default-700">
                        {formatCurrency(lineTotal, "USD")}
                      </td>
                      <td className="p-4 align-top text-right">
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
                onPress={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0, total: 0 })}
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
                <span>{t("invoices.create.sub_total") || "Sub Total"}</span>
                <span className="font-medium">{formatCurrency(subTotal, "USD")}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-danger">
                  <span>{t("invoices.create.discount") || "Discount"}</span>
                  <span>-{formatCurrency(totalDiscount, "USD")}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-sm text-default-600">
                  <span>{t("invoices.create.total_tax") || "Tax"}</span>
                  <span className="font-medium">{formatCurrency(totalTax, "USD")}</span>
                </div>
              )}
              <Divider />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("invoices.create.total") || "Total"}</span>
                <span>{formatCurrency(grandTotal, "USD")}</span>
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
            {isEditing ? "Update Draft" : (t("invoices.create.save_draft") || "Save as Draft")}
          </Button>
          <Button
            color="primary"
            onPress={() => handleSubmit((data) => onSubmit(data as any, "sent"))()}
            isLoading={isSubmitting || updateInvoice.isPending || createInvoice.isPending}
            startContent={<Send className="w-4 h-4" />}
          >
            {isEditing ? "Update & Send" : (t("invoices.create.save_send") || "Save & Send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
