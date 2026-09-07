import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import {
  Building,
  Car,
  CheckCircle2,
  Clock,
  Computer,
  HardDrive,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AccountingPageHeader } from "../components/accounting-ui";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useFixedAssets } from "../hooks/use-fixed-assets";
import type { FixedAsset, CreateFixedAssetDTO } from "../schemas/fixed-asset";

export default function FixedAssetsPage() {
  const { assets, stats, addAsset, postDepreciation } = useFixedAssets();
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  const { isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: onAddOpenChange, onClose: onAddClose } = useDisclosure();
  const { isOpen: isSchedOpen, onOpen: onSchedOpen, onOpenChange: onSchedOpenChange } = useDisclosure();

  const { register, handleSubmit, reset } = useForm<CreateFixedAssetDTO>({
    defaultValues: {
      assetCode: `AST-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: "equipment",
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseCost: 10000,
      salvageValue: 1000,
      usefulLifeYears: 5,
      depreciationMethod: "straight_line",
    },
  });

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddModal = () => {
    reset({
      assetCode: `AST-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: "equipment",
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseCost: 20000,
      salvageValue: 2000,
      usefulLifeYears: 5,
      depreciationMethod: "straight_line",
    });
    onAddOpen();
  };

  const onSubmitAdd = (data: CreateFixedAssetDTO) => {
    addAsset({
      ...data,
      purchaseCost: Number(data.purchaseCost),
      salvageValue: Number(data.salvageValue),
      usefulLifeYears: Number(data.usefulLifeYears),
    });
    toast.success("تم تسجيل الأصل الثابت وتوليد جدول الإهلاك بنجاح");
    onAddClose();
  };

  const handleOpenScheduleModal = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    onSchedOpen();
  };

  const handlePostDepreciation = (assetId: string, year: number) => {
    postDepreciation(assetId, year);
    toast.success(`تم توليد وترحيل قيد الإهلاك المحاسبي لسنة ${year} بنجاح`);
  };

  const getCategoryBadge = (cat: FixedAsset["category"]) => {
    switch (cat) {
      case "vehicle":
        return <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full text-[11px] font-bold"><Car className="h-3 w-3" /> وسائل نقل</span>;
      case "it_hardware":
        return <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full text-[11px] font-bold"><Computer className="h-3 w-3" /> أجهزة وحواسيب</span>;
      case "real_estate":
        return <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[11px] font-bold"><Building className="h-3 w-3" /> عقارات ومباني</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-[11px] font-bold"><Wrench className="h-3 w-3" /> آلات ومعدات</span>;
    }
  };

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="إدارة الأصول الثابتة والإهلاك (Fixed Assets & Depreciation)"
        description="تسجيل أصول المؤسسة الثابتة، تتبع قيمتها الدفترية، وتوليد قيود الإهلاك الدوري آلياً"
        breadcrumbItems={[
          { label: "المحاسبة", to: "/billing" },
          { label: "الأصول الثابتة والإهلاك" },
        ]}
        action={
          <Button
            color="primary"
            variant="solid"
            startContent={<Plus className="h-4 w-4" />}
            onPress={handleOpenAddModal}
          >
            إضافة أصل ثابت جديد
          </Button>
        }
      />

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-default-100 shadow-2xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-default-500 font-medium">تكلفة الأصول الإجمالية</span>
              <MoneyAmount amount={stats.totalCost} className="text-lg font-black text-default-900 block mt-1" />
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
              <HardDrive className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100 shadow-2xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-default-500 font-medium">مجمع الإهلاك التراكمي</span>
              <MoneyAmount amount={stats.totalAccumulated} className="text-lg font-black text-rose-600 block mt-1" />
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100 shadow-2xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-default-500 font-medium">صافي القيمة الدفترية الحالية</span>
              <MoneyAmount amount={stats.totalBookValue} className="text-lg font-black text-emerald-600 block mt-1" />
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-100 shadow-2xs">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-default-500 font-medium">عدد الأصول الثابتة</span>
              <span className="text-lg font-black text-default-900 block mt-1">{stats.count} أصول</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
              <Layers className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-default-50/50 p-3 rounded-2xl border border-default-100">
        <Input
          placeholder="ابحث باسم الأصل أو الرمز..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<Search className="h-4 w-4 text-default-400" />}
          size="sm"
          className="w-full sm:w-80"
        />
      </div>

      {/* Fixed Assets List Table */}
      <Card className="border border-default-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-end text-xs">
            <thead className="bg-default-100/60 text-default-700 font-bold border-b border-default-100">
              <tr>
                <th className="p-3 text-start">رمز واسم الأصل</th>
                <th className="p-3 text-start">الفئة</th>
                <th className="p-3 text-start">تاريخ الشراء</th>
                <th className="p-3">تكلفة الشراء</th>
                <th className="p-3">مجمع الإهلاك</th>
                <th className="p-3">القيمة الدفترية</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100 text-default-900 font-medium">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-default-400">
                    لا توجد أصول ثابتة مسجلة متطابقة مع البحث
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-default-50/50 transition-colors">
                    <td className="p-3 text-start">
                      <div className="font-bold">{asset.name}</div>
                      <div className="text-[11px] font-mono text-default-400">{asset.assetCode}</div>
                    </td>
                    <td className="p-3 text-start">{getCategoryBadge(asset.category)}</td>
                    <td className="p-3 text-start font-mono text-default-600">{asset.purchaseDate}</td>
                    <td className="p-3 font-bold">
                      <MoneyAmount amount={asset.purchaseCost} />
                    </td>
                    <td className="p-3 font-bold text-rose-600">
                      <MoneyAmount amount={asset.accumulatedDepreciation} />
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      <MoneyAmount amount={asset.currentBookValue} />
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="h-7 text-xs font-bold"
                        startContent={<Clock className="h-3.5 w-3.5" />}
                        onPress={() => handleOpenScheduleModal(asset)}
                      >
                        جدول الإهلاك
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Asset Modal */}
      <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange} size="lg">
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitAdd)}>
            <ModalHeader className="text-base font-black">تسجيل أصل ثابت جديد</ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="رمز الأصل" {...register("assetCode")} required size="sm" />
                <Input label="اسم الأصل الثابت" {...register("name")} required size="sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="فئة الأصل" {...register("category")} required size="sm">
                  <SelectItem key="equipment">آلات ومعدات</SelectItem>
                  <SelectItem key="vehicle">وسائل نقل وسيارات</SelectItem>
                  <SelectItem key="it_hardware">أجهزة وحواسيب</SelectItem>
                  <SelectItem key="furniture">أثاث ومكتبيات</SelectItem>
                  <SelectItem key="real_estate">عقارات ومباني</SelectItem>
                </Select>

                <Input label="تاريخ الشراء" type="date" {...register("purchaseDate")} required size="sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="تكلفة الشراء (SAR)" type="number" step="0.01" {...register("purchaseCost")} required size="sm" />
                <Input label="قيمة الخردة / المتبقية" type="number" step="0.01" {...register("salvageValue")} required size="sm" />
                <Input label="العمر الإنتاجي (سنوات)" type="number" {...register("usefulLifeYears")} required size="sm" />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onAddClose}>إلغاء</Button>
              <Button color="primary" type="submit">تسجيل الأصل وحساب الإهلاك</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Depreciation Schedule Modal */}
      <Modal isOpen={isSchedOpen} onOpenChange={onSchedOpenChange} size="2xl">
        <ModalContent>
          <ModalHeader className="text-base font-black">
            جدول الإهلاك المحاسبي: {selectedAsset?.name} ({selectedAsset?.assetCode})
          </ModalHeader>
          <ModalBody className="space-y-4">
            {selectedAsset && (
              <div className="overflow-x-auto border border-default-100 rounded-xl">
                <table className="w-full text-end text-xs">
                  <thead className="bg-default-100/60 font-bold border-b border-default-100">
                    <tr>
                      <th className="p-2.5 text-start">السنة / الفترة</th>
                      <th className="p-2.5">قيمة الإهلاك السنوي</th>
                      <th className="p-2.5">مجمع الإهلاك التراكمي</th>
                      <th className="p-2.5">القيمة الدفترية المتبقية</th>
                      <th className="p-2.5 text-center">حالة القيد المحاسبي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-100 font-medium">
                    {selectedAsset.schedule.map((item) => (
                      <tr key={item.year} className="hover:bg-default-50/50">
                        <td className="p-2.5 font-bold font-mono text-start">{item.year}</td>
                        <td className="p-2.5 font-bold text-rose-600">
                          <MoneyAmount amount={item.depreciationAmount} />
                        </td>
                        <td className="p-2.5 font-bold text-default-700">
                          <MoneyAmount amount={item.accumulatedDepreciation} />
                        </td>
                        <td className="p-2.5 font-bold text-emerald-600">
                          <MoneyAmount amount={item.bookValue} />
                        </td>
                        <td className="p-2.5 text-center">
                          {item.isPosted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                              <CheckCircle2 className="h-3 w-3" /> تم الترحيل
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              className="h-6 text-[11px] font-bold"
                              onPress={() => handlePostDepreciation(selectedAsset.id, item.year)}
                            >
                              ترحيل قيد الإهلاك
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => onSchedOpenChange()}>إغلاق</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
