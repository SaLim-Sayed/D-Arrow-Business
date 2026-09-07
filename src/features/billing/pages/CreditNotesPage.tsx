import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Search, FileText, Trash2, CheckCircle2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { AccountingPageHeader } from "../components/accounting-ui";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useCreditNotes, useCreateCreditNoteMutation } from "../hooks/use-credit-notes";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import type { CreateCreditNoteDTO } from "../schemas/credit-note";

export default function CreditNotesPage() {
  const { data: notes = [], isLoading } = useCreditNotes();
  const { data: invoices = [] } = useInvoices();
  const { data: bills = [] } = useBills();
  const createMutation = useCreateCreditNoteMutation();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit_note" | "debit_note">("all");
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<CreateCreditNoteDTO>({
    defaultValues: {
      type: "credit_note",
      noteNumber: `CN-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date(),
      partnerName: "",
      reason: "",
      subTotal: 0,
      totalTax: 0,
      grandTotal: 0,
      currency: "SAR",
      items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 15, total: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchType = watch("type");
  const watchItems = watch("items") || [];

  const handleOpenNew = (type: "credit_note" | "debit_note") => {
    const prefix = type === "credit_note" ? "CN" : "DN";
    reset({
      type,
      noteNumber: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date(),
      partnerName: "",
      reason: "",
      subTotal: 0,
      totalTax: 0,
      grandTotal: 0,
      currency: "SAR",
      items: [{ description: "مرتجع بضاعة / خدمات", quantity: 1, unitPrice: 0, taxRate: 15, total: 0 }],
    });
    onOpen();
  };

  const handleSelectInvoice = (invId: string) => {
    const inv = invoices.find((i) => i.id === invId);
    if (!inv) return;
    setValue("invoiceId", inv.id);
    setValue("invoiceNumber", inv.invoiceNumber);
    setValue("partnerName", inv.customerName || "عميل غير محدد");
    setValue("items", inv.items.map((it) => ({
      description: `مرتجع: ${it.description}`,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRate: it.taxRate ?? 15,
      total: it.total,
    })));
  };

  const handleSelectBill = (billId: string) => {
    const b = bills.find((item) => item.id === billId);
    if (!b) return;
    setValue("billId", b.id);
    setValue("billNumber", b.billNumber);
    setValue("partnerName", b.vendorName || "مورد غير محدد");
    setValue("items", b.items.map((it) => ({
      description: `مرتجع: ${it.description}`,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRate: it.taxRate ?? 15,
      total: it.total,
    })));
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let totalTax = 0;
    for (const item of watchItems) {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      const t = Number(item.taxRate) || 0;
      const lineNet = q * p;
      const lineTax = lineNet * (t / 100);
      subTotal += lineNet;
      totalTax += lineTax;
    }
    const grandTotal = subTotal + totalTax;
    return { subTotal, totalTax, grandTotal };
  };

  const onSubmit = async (values: CreateCreditNoteDTO) => {
    try {
      const totals = calculateTotals();
      const payload: CreateCreditNoteDTO = {
        ...values,
        subTotal: totals.subTotal,
        totalTax: totals.totalTax,
        grandTotal: totals.grandTotal,
        status: "posted",
        postedAt: new Date(),
      };
      await createMutation.mutateAsync(payload);
      toast.success(values.type === "credit_note" ? "تم تسجيل الإشعار الدائن بنجاح" : "تم تسجيل الإشعار المدين بنجاح");
      onClose();
    } catch (err) {
      toast.error("حدث خطأ أثناء حفظ الإشعار");
    }
  };

  const filtered = notes.filter((n) => {
    const matchesType = filterType === "all" || n.type === filterType;
    const matchesSearch =
      n.noteNumber.toLowerCase().includes(search.toLowerCase()) ||
      n.partnerName.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="الإشعارات الدائنة والمدينة (Credit & Debit Notes)"
        description="إصدار وتتبع إشعارات خصم ومرتجعات الفواتير المبيعات والمشتريات"
        breadcrumbItems={[
          { label: "المحاسبة", to: "/billing" },
          { label: "الإشعارات الدائنة والمدينة" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => handleOpenNew("credit_note")}
            >
              إشعار دائن (مرتجع مبيعات)
            </Button>
            <Button
              color="secondary"
              variant="flat"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => handleOpenNew("debit_note")}
            >
              إشعار مدين (مرتجع مشتريات)
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="بحث برقم الإشعار أو الطرف..."
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={search}
          onValueChange={setSearch}
          className="max-w-xs"
          size="sm"
        />

        <Select
          size="sm"
          selectedKeys={[filterType]}
          onSelectionChange={(keys) => setFilterType(Array.from(keys)[0] as typeof filterType)}
          className="w-48"
          aria-label="نوع الإشعار"
        >
          <SelectItem key="all">جميع الإشعارات</SelectItem>
          <SelectItem key="credit_note">إشعارات دائنة (مرتجع مبيعات)</SelectItem>
          <SelectItem key="debit_note">إشعارات مدينة (مرتجع مشتريات)</SelectItem>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-default-200 bg-default-50">
          <FileText className="h-12 w-12 text-default-300 mb-3" />
          <p className="font-semibold text-default-700">لا توجد إشعارات مسجلة</p>
          <p className="text-xs text-default-500 mt-1 max-w-sm">
            يمكنك إصدار إشعار دائن لتخفيض فاتورة مبيعات أو إشعار مدين لتخفيض فاتورة شراء.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Button size="sm" color="primary" variant="flat" onPress={() => handleOpenNew("credit_note")}>
              إشعار دائن جديد
            </Button>
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleOpenNew("debit_note")}>
              إشعار مدين جديد
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-default-200 bg-content1 shadow-sm">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-default-200 bg-default-100/60 font-semibold text-default-700">
                <th className="py-3 px-4">نوع الإشعار</th>
                <th className="py-3 px-4">رقم الإشعار</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">الطرف (العميل/المورد)</th>
                <th className="py-3 px-4">الفاتورة المرتبطة</th>
                <th className="py-3 px-4 text-left">إجمالي الإشعار (SAR)</th>
                <th className="py-3 px-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {filtered.map((note) => (
                <tr key={note.id ?? note.noteNumber} className="hover:bg-default-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium">
                    {note.type === "credit_note" ? (
                      <span className="inline-flex items-center gap-1 text-danger font-bold">
                        <ArrowDownRight className="h-3.5 w-3.5" /> إشعار دائن (مبيعات)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-success font-bold">
                        <ArrowUpRight className="h-3.5 w-3.5" /> إشعار مدين (مشتريات)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-default-900">{note.noteNumber}</td>
                  <td className="py-3 px-4 text-default-600">
                    {note.date ? new Date(note.date).toLocaleDateString("ar-SA") : "—"}
                  </td>
                  <td className="py-3 px-4 font-medium text-default-800">{note.partnerName}</td>
                  <td className="py-3 px-4 font-mono text-default-500">
                    {note.invoiceNumber || note.billNumber || "—"}
                  </td>
                  <td className="py-3 px-4 text-left font-mono font-bold">
                    <MoneyAmount amount={note.grandTotal} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-success/10 text-success">
                      <CheckCircle2 className="h-3 w-3" /> مرحل
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Creating Credit / Debit Note */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onCloseModal) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader>
                {watchType === "credit_note" ? "إصدار إشعار دائن (مرتجع مبيعات)" : "إصدار إشعار مدين (مرتجع مشتريات)"}
              </ModalHeader>
              <ModalBody className="space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="رقم الإشعار" {...register("noteNumber", { required: true })} />
                  <Input
                    label="الطرف (اسم العميل/المورد)"
                    placeholder="أدخل اسم العميل أو المورد..."
                    {...register("partnerName", { required: true })}
                  />
                </div>

                {watchType === "credit_note" ? (
                  <Select
                    label="ربط بفاتورة مبيعات (اختياري)"
                    placeholder="اختر فاتورة المبيعات المراد تخفيضها..."
                    onSelectionChange={(keys) => handleSelectInvoice(Array.from(keys)[0] as string)}
                  >
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id!} textValue={`${inv.invoiceNumber} - ${inv.customerName || "عميل"}`}>
                        {inv.invoiceNumber} ({inv.customerName || "عميل"}) - <MoneyAmount amount={inv.grandTotal} />
                      </SelectItem>
                    ))}
                  </Select>
                ) : (
                  <Select
                    label="ربط بفاتورة مشتريات (اختياري)"
                    placeholder="اختر فاتورة المشتريات المراد تخفيضها..."
                    onSelectionChange={(keys) => handleSelectBill(Array.from(keys)[0] as string)}
                  >
                    {bills.map((b) => (
                      <SelectItem key={b.id!} textValue={`${b.billNumber} - ${b.vendorName || "مورد"}`}>
                        {b.billNumber} ({b.vendorName || "مورد"}) - <MoneyAmount amount={b.grandTotal} />
                      </SelectItem>
                    ))}
                  </Select>
                )}

                <Textarea label="سبب الإشعار / الملاحظات" placeholder="مثال: مرتجع بضاعة تالفة / خصم متفق عليه..." {...register("reason")} />

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-default-800">بنود الإشعار</h4>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<Plus className="h-3.5 w-3.5" />}
                      onPress={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 15, total: 0 })}
                    >
                      إضافة بند
                    </Button>
                  </div>

                  {fields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-default-200 bg-default-50">
                      <div className="col-span-5">
                        <Input size="sm" placeholder="وصف البند المرتجع" {...register(`items.${idx}.description` as const, { required: true })} />
                      </div>
                      <div className="col-span-2">
                        <Input size="sm" type="number" placeholder="الكمية" {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })} />
                      </div>
                      <div className="col-span-2">
                        <Input size="sm" type="number" placeholder="السعر" {...register(`items.${idx}.unitPrice` as const, { valueAsNumber: true })} />
                      </div>
                      <div className="col-span-2">
                        <Input size="sm" type="number" placeholder="الضريبة %" {...register(`items.${idx}.taxRate` as const, { valueAsNumber: true })} />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => remove(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                {(() => {
                  const totals = calculateTotals();
                  return (
                    <div className="p-4 rounded-xl bg-default-100 space-y-1.5 text-xs font-medium">
                      <div className="flex justify-between">
                        <span>المبلغ قبل الضريبة:</span>
                        <span className="font-mono font-bold"><MoneyAmount amount={totals.subTotal} /></span>
                      </div>
                      <div className="flex justify-between text-danger">
                        <span>ضريبة القيمة المضافة (15%):</span>
                        <span className="font-mono font-bold"><MoneyAmount amount={totals.totalTax} /></span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-default-900 pt-2 border-t border-default-200">
                        <span>إجمالي الإشعار الإجمالي:</span>
                        <span className="font-mono font-black text-primary"><MoneyAmount amount={totals.grandTotal} /></span>
                      </div>
                    </div>
                  );
                })()}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onCloseModal}>إلغاء</Button>
                <Button color="primary" type="submit" isLoading={createMutation.isPending}>
                  حفظ وترحيل الإشعار
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
