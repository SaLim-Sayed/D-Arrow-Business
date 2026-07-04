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
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

import { selectFieldProps } from "@/components/shared/select-field";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import { useAccounts } from "../hooks/use-accounts";
import {
  useCreateBillMutation,
  useUpdateBillMutation,
  useBill,
} from "../hooks/use-bills";
import { billSchema, type CreateBillDTO } from "../schemas/bill";
import { formatCurrency } from "@/lib/utils";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { LineTaxRateSelect } from "../components/LineTaxRateSelect";
import { getDefaultTax } from "../utils/tax-utils";

export default function CreateBillPage() {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data || [];
  const { data: accounts = [] } = useAccounts();
  const expenseAccounts = accounts.filter(
    (a) => a.type === "expense" || a.type === "asset"
  );

  const { data: existingBill, isLoading: isLoadingExisting } = useBill(id);
  const createBill = useCreateBillMutation();
  const updateBill = useUpdateBillMutation();
  const { data: billingSettings } = useBillingSettings();
  const taxes = billingSettings?.taxes ?? [];
  const defaultTax = getDefaultTax(taxes);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBillDTO>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: {
      billNumber: "DRAFT",
      status: "draft",
      currency: "USD",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: "",
          accountId: expenseAccounts[0]?.id ?? "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          taxRateId: null,
          total: 0,
        },
      ],
      subTotal: 0,
      totalTax: 0,
      grandTotal: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = watch("items");

  useEffect(() => {
    if (isEditing && existingBill) {
      control._reset({
        ...existingBill,
        issueDate: new Date(existingBill.issueDate),
        dueDate: new Date(existingBill.dueDate),
      } as any);
    }
  }, [isEditing, existingBill, control]);

  useEffect(() => {
    if (isEditing || !defaultTax) return;
    const items = watch("items");
    if (
      items?.length === 1 &&
      !items[0]?.taxRateId &&
      (items[0]?.taxRate ?? 0) === 0
    ) {
      setValue("items.0.taxRateId", defaultTax.id);
      setValue("items.0.taxRate", defaultTax.rate);
    }
  }, [defaultTax, isEditing, setValue, watch]);

  const subTotal = watchItems.reduce(
    (acc, item) =>
      acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const totalTax = watchItems.reduce((acc, item) => {
    const beforeTax =
      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return acc + beforeTax * ((Number(item.taxRate) || 0) / 100);
  }, 0);
  const grandTotal = subTotal + totalTax;

  const buildPayload = (
    data: CreateBillDTO,
    actionType: "draft" | "open"
  ): CreateBillDTO => ({
    ...data,
    status: actionType,
    subTotal,
    totalTax,
    grandTotal,
    items: watchItems.map((item, index) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.unitPrice) || 0;
      const tx = Number(item.taxRate) || 0;
      const beforeTax = q * r;
      return {
        ...data.items[index],
        ...item,
        total: beforeTax + beforeTax * (tx / 100),
      };
    }),
  });

  const onSubmit = async (data: CreateBillDTO, actionType: "draft" | "open") => {
    try {
      const finalData = buildPayload(data, actionType);
      if (isEditing && id) {
        await updateBill.mutateAsync({ id, data: finalData });
        toast.success(
          actionType === "open"
            ? t("bills.create.posted")
            : t("bills.create.updated")
        );
      } else {
        await createBill.mutateAsync(finalData);
        toast.success(
          actionType === "open"
            ? t("bills.create.posted")
            : t("bills.create.draft_saved")
        );
      }
      navigate("/billing/bills");
    } catch {
      toast.error(t("bills.create.save_failed"));
    }
  };

  if (isEditing && isLoadingExisting) {
    return (
      <div className="p-8 text-center animate-pulse">
        {t("bills.detail.loading")}
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
        <Link to="/billing/bills" className="hover:text-primary">
          {t("bills.title")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="font-medium text-default-800">
          {isEditing ? t("bills.create.edit_title") : t("bills.create.title")}
        </span>
      </nav>

      <p className="text-sm text-default-500">{t("bills.create.subtitle")}</p>

      <form className="space-y-6">
        <Card className="border border-default-100 shadow-sm rounded-2xl">
          <CardBody className="gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={control}
                name="vendorId"
                render={({ field }) => (
                  <Select
                    {...selectFieldProps()}
                    {...field}
                    label={t("bills.create.vendor") || "Vendor"}
                    placeholder={t("bills.create.vendor_placeholder") || "Select vendor"}
                    variant="bordered"
                    isInvalid={!!errors.vendorId}
                    errorMessage={errors.vendorId?.message as string}
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
                label={t("bills.create.bill_number") || "Bill Number"}
                variant="bordered"
                isReadOnly
                {...register("billNumber")}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100 shadow-sm rounded-2xl">
          <CardHeader className="px-6 py-4 bg-default-50/50">
            <h3 className="font-bold text-lg">
              {t("bills.create.line_items") || "Line Items"}
            </h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px] text-start">
              <thead className="bg-default-100/50 text-sm font-medium text-default-600">
                <tr>
                  <th className="p-4 w-[25%]">
                    {t("bills.create.account") || "Expense Account"}
                  </th>
                  <th className="p-4 w-[25%]">
                    {t("bills.create.item_description")}
                  </th>
                  <th className="p-4 w-[12%]">{t("bills.create.quantity")}</th>
                  <th className="p-4 w-[12%]">{t("bills.create.rate")}</th>
                  <th className="p-4 w-[12%]">{t("bills.create.tax")}</th>
                  <th className="p-4 w-[12%] text-end">{t("bills.create.amount")}</th>
                  <th className="p-4 w-[2%]" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const q = Number(watch(`items.${index}.quantity`)) || 0;
                  const r = Number(watch(`items.${index}.unitPrice`)) || 0;
                  const tx = Number(watch(`items.${index}.taxRate`)) || 0;
                  const lineTotal = q * r + q * r * (tx / 100);
                  return (
                    <tr key={field.id} className="border-b border-default-100">
                      <td className="p-4">
                        <Controller
                          control={control}
                          name={`items.${index}.accountId`}
                          render={({ field: f }) => (
                            <Select
                              {...selectFieldProps({ compact: true })}
                              size="sm"
                              variant="flat"
                              selectedKeys={f.value ? [f.value] : []}
                              onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0];
                                f.onChange(key ? String(key) : "");
                              }}
                            >
                              {expenseAccounts.map((a) => (
                                <SelectItem
                                  key={a.id!}
                                  textValue={t(`accounts.names.${a.name}`, {
                                    defaultValue: a.name,
                                  })}
                                >
                                  {a.code} —{" "}
                                  {t(`accounts.names.${a.name}`, {
                                    defaultValue: a.name,
                                  })}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          size="sm"
                          variant="flat"
                          {...register(`items.${index}.description` as const)}
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          size="sm"
                          type="number"
                          variant="flat"
                          {...register(`items.${index}.quantity` as const, {
                            valueAsNumber: true,
                          })}
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          size="sm"
                          type="number"
                          variant="flat"
                          dir="ltr"
                          classNames={{ input: "text-start" }}
                          startContent={
                            <span className="text-default-400 text-xs">$</span>
                          }
                          {...register(`items.${index}.unitPrice` as const, {
                            valueAsNumber: true,
                          })}
                        />
                      </td>
                      <td className="p-4">
                        <LineTaxRateSelect
                          taxes={taxes}
                          taxRateId={watch(`items.${index}.taxRateId`)}
                          onChange={(tax) => {
                            setValue(`items.${index}.taxRateId`, tax?.id ?? null);
                            setValue(`items.${index}.taxRate`, tax?.rate ?? 0);
                          }}
                        />
                      </td>
                      <td className="p-4 text-end font-medium">
                        <span dir="ltr">{formatCurrency(lineTotal, "USD")}</span>
                      </td>
                      <td className="p-4">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => remove(index)}
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
                onPress={() =>
                  append({
                    description: "",
                    accountId: expenseAccounts[0]?.id ?? "",
                    quantity: 1,
                    unitPrice: 0,
                    taxRate: defaultTax?.rate ?? 0,
                    taxRateId: defaultTax?.id ?? null,
                    total: 0,
                  })
                }
              >
                {t("bills.create.add_line") || "Add line"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col md:flex-row gap-6 justify-between">
          <Textarea
            label={t("bills.create.notes") || "Notes"}
            variant="bordered"
            className="md:w-1/2"
            {...register("notes")}
          />
          <Card className="md:w-1/3 border border-default-100">
            <CardBody className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{t("bills.create.subtotal")}</span>
                <span dir="ltr">{formatCurrency(subTotal, "USD")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("bills.create.total_tax")}</span>
                <span dir="ltr">{formatCurrency(totalTax, "USD")}</span>
              </div>
              <Divider />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("bills.create.total")}</span>
                <span dir="ltr">{formatCurrency(grandTotal, "USD")}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="flat"
            onPress={() => handleSubmit((d) => onSubmit(d as any, "draft"))()}
            isLoading={isSubmitting || createBill.isPending || updateBill.isPending}
            startContent={<Save className="w-4 h-4" />}
          >
            {t("bills.create.save_draft") || "Save Draft"}
          </Button>
          <Button
            color="primary"
            onPress={() => handleSubmit((d) => onSubmit(d as any, "open"))()}
            isLoading={isSubmitting || createBill.isPending || updateBill.isPending}
            startContent={<Send className="w-4 h-4" />}
          >
            {t("bills.create.post") || "Post Bill"}
          </Button>
        </div>
      </form>
    </div>
  );
}
