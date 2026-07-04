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
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { selectFieldProps } from "@/components/shared/select-field";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import { useProducts } from "../hooks/use-products";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { useCreateGenericDocumentMutation } from "../hooks/use-generic-documents";
import { genericDocumentSchema, type CreateGenericDocumentDTO } from "../schemas/generic-document";
import { formatCurrency } from "@/lib/utils";
import { LineTaxRateSelect } from "../components/LineTaxRateSelect";
import {
  getDefaultTax,
  getTaxRateForProduct,
} from "../utils/tax-utils";

export default function CreateGenericInvoicePage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();

  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data || [];
  
  const { data: products = [] } = useProducts();
  const { data: billingSettings } = useBillingSettings();
  const taxes = billingSettings?.taxes ?? [];
  const defaultTax = getDefaultTax(taxes);
  
  const createDocument = useCreateGenericDocumentMutation();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateGenericDocumentDTO>({
    resolver: zodResolver(genericDocumentSchema) as any,
    defaultValues: {
      documentType: "invoice",
      documentNumber: "DRAFT",
      status: "draft",
      currency: "USD",
      exchangeRate: 1,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      toEntity: {
        id: "",
        type: "contact",
      },
      items: [{
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discount: 0,
        discountType: "fixed",
        total: 0,
        optional: false,
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

  const watchItems = watch("items");

  // Dynamic calculations
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
      discountType: "fixed",
      total: 0,
      optional: false,
    });
  };

  const onSubmit = async (data: CreateGenericDocumentDTO, actionType: "draft" | "sent") => {
    try {
      const finalData: CreateGenericDocumentDTO = {
        ...data,
        status: actionType as any,
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
      
      await createDocument.mutateAsync(finalData);
      toast.success(
        actionType === "sent"
          ? "Document sent successfully"
          : "Draft saved successfully"
      );
      navigate("/billing/documents");
    } catch {
      toast.error("Failed to save document");
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <nav className="flex items-center gap-1 text-sm text-default-500">
        <Link to="/billing" className="hover:text-primary">
          {t("module_name")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <Link to="/billing/documents" className="hover:text-primary">
          Documents
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">
          Create Document
        </span>
      </nav>

      <p className="text-sm text-default-500">Create a new document using the generic system</p>

      <form className="space-y-6">
        <Card className="p-2 border border-default-100 shadow-sm rounded-2xl">
          <CardBody className="gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entity Type Selection */}
              <Controller
                control={control}
                name="toEntity.type"
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    {...field}
                    label="Entity Type"
                    placeholder="Select entity type"
                    variant="bordered"
                  >
                    <SelectItem key="contact" textValue="contact">Contact</SelectItem>
                    <SelectItem key="company" textValue="company">Company</SelectItem>
                    <SelectItem key="project" textValue="project">Project</SelectItem>
                    <SelectItem key="vendor" textValue="vendor">Vendor</SelectItem>
                  </Select>
                )}
              />

              {/* Entity ID (Contact) */}
              <Controller
                control={control}
                name="toEntity.id"
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    {...field}
                    label="Entity"
                    placeholder="Select entity"
                    variant="bordered"
                    isInvalid={!!errors.toEntity?.id}
                    errorMessage={errors.toEntity?.id?.message as string}
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
                label="Document Number"
                variant="bordered"
                isReadOnly
                {...register("documentNumber")}
                description="Assigned when posted"
              />
            </div>
          </CardBody>
        </Card>

        {/* Items Table */}
        <Card className="border border-default-100 shadow-sm rounded-2xl">
          <CardHeader className="px-6 py-4 flex justify-between items-center bg-default-50/50">
            <h3 className="font-bold text-lg">Item Details</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-default-100/50 text-sm font-medium text-default-600">
                <tr>
                  <th className="p-4 w-[30%]">Product / Item</th>
                  <th className="p-4 w-[15%]">Quantity</th>
                  <th className="p-4 w-[15%]">Rate</th>
                  <th className="p-4 w-[15%]">Tax</th>
                  <th className="p-4 w-[15%] text-end">Amount</th>
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
                            placeholder="Select Product..."
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
                            placeholder="Item description..."
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
                        <span dir="ltr">{formatCurrency(lineTotal, "USD")}</span>
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
                onPress={appendLine}
              >
                Add another line
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="w-full md:w-1/2 space-y-4">
             <Textarea
               label="Notes"
               placeholder="Thanks for your business."
               variant="bordered"
               {...register("notes")}
             />
             <Textarea
               label="Terms & Conditions"
               placeholder="Payment due in 15 days."
               variant="bordered"
               {...register("termsAndConditions")}
             />
          </div>

          <Card className="w-full md:w-1/3 border border-default-100 shadow-sm rounded-2xl bg-default-50/50">
            <CardBody className="p-6 space-y-4">
              <div className="flex justify-between text-sm text-default-600">
                <span>Sub Total</span>
                <span className="font-medium" dir="ltr">{formatCurrency(subTotal, "USD")}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-danger">
                  <span>Discount</span>
                  <span dir="ltr">-{formatCurrency(totalDiscount, "USD")}</span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-sm text-default-600">
                  <span>Total Tax</span>
                  <span className="font-medium" dir="ltr">{formatCurrency(totalTax, "USD")}</span>
                </div>
              )}
              <Divider />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span dir="ltr">{formatCurrency(grandTotal, "USD")}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-default-100 shadow-xl z-10">
          <Button
            variant="flat"
            onPress={() => handleSubmit((data) => onSubmit(data as any, "draft"))()}
            isLoading={isSubmitting || createDocument.isPending}
            startContent={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
          <Button
            color="primary"
            onPress={() => handleSubmit((data) => onSubmit(data as any, "sent"))()}
            isLoading={isSubmitting || createDocument.isPending}
            startContent={<Send className="w-4 h-4" />}
          >
            Save & Send
          </Button>
        </div>
      </form>
    </div>
  );
}
