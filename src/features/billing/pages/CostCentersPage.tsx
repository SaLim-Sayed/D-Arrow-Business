import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import { Plus, Search, Layers, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AccountingPageHeader } from "../components/accounting-ui";
import {
  useCostCenters,
  useCreateCostCenterMutation,
  useUpdateCostCenterMutation,
  useDeleteCostCenterMutation,
} from "../hooks/use-cost-centers";
import type { CostCenter, CreateCostCenterDTO } from "../schemas/cost-center";

export default function CostCentersPage() {
  const { data: costCenters = [], isLoading } = useCostCenters();
  const createMutation = useCreateCostCenterMutation();
  const updateMutation = useUpdateCostCenterMutation();
  const deleteMutation = useDeleteCostCenterMutation();

  const [search, setSearch] = useState("");
  const [selectedCc, setSelectedCc] = useState<CostCenter | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const { register, handleSubmit, reset } = useForm<CreateCostCenterDTO>({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      isActive: true,
    },
  });

  const handleOpenAdd = () => {
    setSelectedCc(null);
    reset({
      code: `CC-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      description: "",
      isActive: true,
    });
    onOpen();
  };

  const handleOpenEdit = (cc: CostCenter) => {
    setSelectedCc(cc);
    reset({
      code: cc.code,
      name: cc.name,
      description: cc.description || "",
      isActive: cc.isActive ?? true,
    });
    onOpen();
  };

  const onSubmit = async (values: CreateCostCenterDTO) => {
    try {
      if (selectedCc?.id) {
        await updateMutation.mutateAsync({ id: selectedCc.id, data: values });
        toast.success("تم تحديث مركز التكلفة بنجاح");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("تم إضافة مركز التكلفة بنجاح");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ في الحفظ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف مركز التكلفة هذا؟")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("تم حذف مركز التكلفة");
    } catch (err) {
      toast.error("فشل حذف مركز التكلفة");
    }
  };

  const filtered = costCenters.filter(
    (cc) =>
      cc.name.toLowerCase().includes(search.toLowerCase()) ||
      cc.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="مراكز التكلفة (Cost Centers)"
        description="إدارة وتخصيص مراكز التكلفة لمتابعة الأداء والربحية بالفروع والمشاريع"
        breadcrumbItems={[
          { label: "المحاسبة", to: "/billing" },
          { label: "مراكز التكلفة" },
        ]}
        action={
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleOpenAdd}
            className="font-medium"
          >
            إضافة مركز تكلفة
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="بحث بالاسم أو الكود..."
          startContent={<Search className="h-4 w-4 text-default-400" />}
          value={search}
          onValueChange={setSearch}
          className="max-w-xs"
          size="sm"
        />
        <div className="text-xs text-default-500 font-medium">
          إجمالي مراكز التكلفة: {costCenters.length}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-default-200 bg-default-50">
          <Layers className="h-12 w-12 text-default-300 mb-3" />
          <p className="font-semibold text-default-700">لا توجد مراكز تكلفة معرفة</p>
          <p className="text-xs text-default-500 mt-1 max-w-sm">
            قم بإضافة مراكز التكلفة الأولى لتوزيع المصاريف والإيرادات بين الفروع والمشاريع.
          </p>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Plus className="h-3.5 w-3.5" />}
            onPress={handleOpenAdd}
            className="mt-4"
          >
            إضافة مركز تكلفة جديد
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cc) => (
            <div
              key={cc.id ?? cc.code}
              className="p-4 rounded-xl border border-default-200 bg-content1 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                    {cc.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      cc.isActive
                        ? "bg-success/10 text-success"
                        : "bg-default-100 text-default-500"
                    }`}
                  >
                    {cc.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> نشط
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" /> غير نشط
                      </>
                    )}
                  </span>
                </div>
                <h3 className="font-bold text-default-900 mt-3 text-base">{cc.name}</h3>
                {cc.description && (
                  <p className="text-xs text-default-500 mt-1 line-clamp-2">
                    {cc.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-default-100">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => handleOpenEdit(cc)}
                  aria-label="تعديل"
                >
                  <Edit2 className="h-4 w-4 text-default-600" />
                </Button>
                {cc.id && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    isIconOnly
                    onPress={() => handleDelete(cc.id!)}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          {(onCloseModal) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader>
                {selectedCc ? "تعديل مركز تكلفة" : "إضافة مركز تكلفة جديد"}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="رمز مركز التكلفة (Code)"
                  placeholder="مثال: CC-101"
                  {...register("code", { required: true })}
                />
                <Input
                  label="اسم مركز التكلفة (Name)"
                  placeholder="مثال: فرع الرياض / مشروع أ"
                  {...register("name", { required: true })}
                />
                <Textarea
                  label="الوصف (اختياري)"
                  placeholder="ملاحظات تفصيلية عن هذا المركز..."
                  {...register("description")}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onCloseModal}>
                  إلغاء
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  حفظ البيانات
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
