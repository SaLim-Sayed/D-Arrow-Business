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
  Textarea,
  useDisclosure,
} from "@heroui/react";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { AccountingPageHeader } from "../components/accounting-ui";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useFiscalClosing } from "../hooks/use-fiscal-closing";
import type { FiscalYear } from "../schemas/fiscal-closing";

export default function FiscalClosingPage() {
  const { years, lockSettings, updateLockDate, removeLockDate, closeFiscalYear } = useFiscalClosing();
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [newLockDate, setNewLockDate] = useState(lockSettings.lockDate || "2025-12-31");
  const [newLockReason, setNewLockReason] = useState(lockSettings.lockReason || "");

  const { isOpen: isLockOpen, onOpen: onLockOpen, onOpenChange: onLockOpenChange, onClose: onLockClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onOpenChange: onCloseOpenChange, onClose: onCloseClose } = useDisclosure();

  const handleSaveLock = () => {
    updateLockDate(newLockDate, newLockReason);
    toast.success("تم تحديث تاريخ قفل الحركات المالية وتجميد الفترة بنجاح");
    onLockClose();
  };

  const handleUnlock = () => {
    removeLockDate();
    toast.success("تم إلغاء تاريخ القفل والسماح بالتعديل على الحركات المحاسبية");
  };

  const handleOpenCloseWizard = (fy: FiscalYear) => {
    setSelectedYear(fy);
    onCloseOpen();
  };

  const handleConfirmClosingYear = () => {
    if (!selectedYear) return;
    closeFiscalYear(selectedYear.year);
    toast.success(`تم إقفال السنة المالية ${selectedYear.year} وتوليد قيد الإقفال السنوي ونقل الأرباح المبقاة بنجاح`);
    onCloseClose();
  };

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="تجميد الفترات وإقفال السنة المالية (Fiscal Lock & Year-End Closing)"
        description="تجميد وقفل الفترات المحاسبية السابقة لحماية البيانات وإصدار قيود الإقفال السنوية ونقل الأرباح المبقاة"
        breadcrumbItems={[
          { label: "المحاسبة", to: "/billing" },
          { label: "تجميد الفترات وإقفال السنة" },
        ]}
      />

      {/* Fiscal Lock Date Banner */}
      <Card className={`border shadow-xs ${lockSettings.isLocked ? "border-amber-500/30 bg-amber-500/5" : "border-default-100 bg-default-50/50"}`}>
        <CardBody className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${lockSettings.isLocked ? "bg-amber-500/15 text-amber-600" : "bg-default-200 text-default-600"}`}>
              {lockSettings.isLocked ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-default-900">
                  تاريخ قفل الحركات المحاسبية (Lock Date)
                </h2>
                {lockSettings.isLocked && (
                  <span className="bg-amber-500/15 text-amber-700 font-bold px-2 py-0.5 rounded-full text-[11px]">
                    مفعل ومجمد
                  </span>
                )}
              </div>
              <p className="text-xs text-default-600 mt-1">
                {lockSettings.isLocked
                  ? `يمنع تعديل أو حذف أو إضافة أي حركة مالية قبل تاريخ: ${lockSettings.lockDate}`
                  : "لا يوجد تاريخ قفل حالياً. يمكن التعديل على جميع الحركات المحاسبية في أي تاريخ."}
              </p>
              {lockSettings.lockReason && (
                <p className="text-[11px] font-medium text-default-500 italic mt-0.5">
                  سبب القفل: {lockSettings.lockReason}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lockSettings.isLocked && (
              <Button size="sm" variant="flat" color="danger" onPress={handleUnlock}>
                إلغاء القفل
              </Button>
            )}
            <Button size="sm" color="primary" variant="solid" startContent={<Lock className="h-3.5 w-3.5" />} onPress={onLockOpen}>
              تحديد تاريخ القفل
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Fiscal Years Status Table */}
      <Card className="border border-default-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-default-100 bg-default-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-default-900">سجل السنوات المالية والإقفال السنوي</h3>
            <p className="text-xs text-default-500">حالة إقفال الحسابات وتدوير الأرباح والخسائر</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-end text-xs">
            <thead className="bg-default-100/60 text-default-700 font-bold border-b border-default-100">
              <tr>
                <th className="p-3 text-start">السنة المالية</th>
                <th className="p-3 text-start">الفترة الزمنية</th>
                <th className="p-3">إجمالي الإيرادات</th>
                <th className="p-3">إجمالي المصاريف</th>
                <th className="p-3">صافي الربح / (الخسارة)</th>
                <th className="p-3">الحالة المحاسبية</th>
                <th className="p-3 text-center">معالج الإقفال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100 text-default-900 font-medium">
              {years.map((fy) => (
                <tr key={fy.year} className="hover:bg-default-50/50 transition-colors">
                  <td className="p-3 text-start font-black text-sm">{fy.year}</td>
                  <td className="p-3 text-start font-mono text-default-600">
                    {fy.startDate} ⬅️ {fy.endDate}
                  </td>
                  <td className="p-3 font-bold text-emerald-600">
                    <MoneyAmount amount={fy.totalRevenue} />
                  </td>
                  <td className="p-3 font-bold text-rose-600">
                    <MoneyAmount amount={fy.totalExpense} />
                  </td>
                  <td className="p-3 font-black">
                    <MoneyAmount amount={fy.netProfitLoss} className={fy.netProfitLoss >= 0 ? "text-emerald-600" : "text-rose-600"} />
                  </td>
                  <td className="p-3">
                    {fy.status === "closed" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5" /> مقفلة (Closed)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-500/10 px-2.5 py-1 rounded-xl">
                        <Clock className="h-3.5 w-3.5" /> مفتوحة (Open)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {fy.status === "closed" ? (
                      <span className="text-default-400 font-mono text-[11px]">
                        {fy.closingJournalId}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        className="h-7 text-xs font-bold"
                        startContent={<BookOpenCheck className="h-3.5 w-3.5" />}
                        onPress={() => handleOpenCloseWizard(fy)}
                      >
                        إقفال السنة المالية
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lock Date Modal */}
      <Modal isOpen={isLockOpen} onOpenChange={onLockOpenChange} size="md">
        <ModalContent>
          <ModalHeader className="text-base font-black">تحديد تاريخ قفل الحركات المحاسبية</ModalHeader>
          <ModalBody className="space-y-3">
            <Input
              label="تاريخ القفل (Lock Date)"
              type="date"
              value={newLockDate}
              onChange={(e) => setNewLockDate(e.target.value)}
              size="sm"
            />
            <Textarea
              label="سبب القفل / التجميد"
              placeholder="مثال: تم إكمال الإقرار الضريبي واعتماد الميزانية العمومية"
              value={newLockReason}
              onChange={(e) => setNewLockReason(e.target.value)}
              size="sm"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onLockClose}>إلغاء</Button>
            <Button color="primary" onPress={handleSaveLock}>حفظ وقفل الحركات</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Closing Fiscal Year Wizard Modal */}
      <Modal isOpen={isCloseOpen} onOpenChange={onCloseOpenChange} size="lg">
        <ModalContent>
          <ModalHeader className="text-base font-black">
            معالج إقفال السنة المالية {selectedYear?.year}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {selectedYear && (
              <>
                <div className="p-3 rounded-xl bg-default-100/60 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-default-500">إجمالي الإيرادات المقفلة:</span>
                    <MoneyAmount amount={selectedYear.totalRevenue} className="font-bold text-emerald-600" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">إجمالي المصاريف المقفلة:</span>
                    <MoneyAmount amount={selectedYear.totalExpense} className="font-bold text-rose-600" />
                  </div>
                  <div className="flex justify-between border-t border-default-200 pt-2">
                    <span className="text-default-900 font-bold">صافي الربح المنقول للأرباح المبقاة:</span>
                    <MoneyAmount amount={selectedYear.netProfitLoss} className="font-black text-primary" />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    معاينة قيد الإقفال المحاسبي الآلي:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                    <li>من حـ/ حسابات الإيرادات (تصفير الأرصدة)</li>
                    <li>إلى حـ/ حسابات المصاريف (تصفير الأرصدة)</li>
                    <li>إلى حـ/ الأرباح المبقاة - Retained Earnings (صافي الناتج)</li>
                  </ul>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onCloseClose}>إلغاء</Button>
            <Button color="primary" onPress={handleConfirmClosingYear}>تأكيد وتوليد قيد الإقفال السنوي</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
