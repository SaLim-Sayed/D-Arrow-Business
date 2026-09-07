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
import {
  Building2,
  CheckCircle2,
  HelpCircle,
  Search,
  UploadCloud,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AccountingPageHeader } from "../components/accounting-ui";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useBankReconciliation } from "../hooks/use-bank-reconciliation";
import type { BankStatementItem } from "../schemas/bank-reconciliation";

export default function BankReconciliationPage() {
  const { items, summary, matchItem, unmatchItem, importStatement } = useBankReconciliation();
  const [filter, setFilter] = useState<"all" | "reconciled" | "unreconciled">("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<BankStatementItem | null>(null);
  const [matchTxId, setMatchTxId] = useState("");
  const [matchType, setMatchType] = useState<"invoice" | "bill" | "voucher" | "journal">("invoice");
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const matchesSearch =
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      (item.reference && item.reference.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleOpenMatchModal = (item: BankStatementItem) => {
    setSelectedItem(item);
    setMatchTxId(item.type === "credit" ? "INV-1002" : "BILL-2002");
    setMatchType(item.type === "credit" ? "invoice" : "bill");
    onOpen();
  };

  const handleConfirmMatch = () => {
    if (!selectedItem || !matchTxId) return;
    matchItem(selectedItem.id, matchTxId, matchType);
    toast.success("تم مطابقة المعاملة البنكية بنجاح مع الحركة المحاسبية");
    onClose();
  };

  const handleSimulateImport = () => {
    importStatement([
      {
        date: new Date().toISOString().slice(0, 10),
        description: "تحويل مباشر من عميل تجريبي",
        reference: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: 12500,
        type: "credit",
      },
    ]);
    toast.success("تم استيراد كشف الحساب البنكي بنجاح");
  };

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="التسوية والمطابقة البنكية (Bank Reconciliation)"
        description="مطابقة كشوف الحسابات البنكية تلقائياً مع القيود والسندات المحاسبية وإيجاد الفروقات"
        breadcrumbItems={[
          { label: "المحاسبة", to: "/billing" },
          { label: "التسوية والمطابقة البنكية" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              variant="solid"
              startContent={<UploadCloud className="h-4 w-4" />}
              onPress={handleSimulateImport}
            >
              استيراد كشف بنكي
            </Button>
          </div>
        }
      />

      {/* Account Info Card & Summary Statistics */}
      <Card className="border border-default-100 bg-gradient-to-r from-default-50 via-background to-default-50/50 shadow-xs">
        <CardBody className="p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-default-900">{summary.bankAccountName}</h2>
                <p className="text-xs font-mono text-default-500">{summary.accountNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
              <div className="px-4 py-2 rounded-xl bg-background border border-default-100 shadow-2xs">
                <span className="text-[11px] text-default-500 font-medium block">رصيد كشف البنك</span>
                <MoneyAmount amount={summary.statementClosingBalance} className="text-sm font-black text-default-900" />
              </div>

              <div className="px-4 py-2 rounded-xl bg-background border border-default-100 shadow-2xs">
                <span className="text-[11px] text-default-500 font-medium block">الرصيد الدفتري</span>
                <MoneyAmount amount={summary.bookBalance} className="text-sm font-black text-primary" />
              </div>

              <div className="px-4 py-2 rounded-xl bg-background border border-default-100 shadow-2xs">
                <span className="text-[11px] text-default-500 font-medium block">الفارق غير المطابق</span>
                <MoneyAmount
                  amount={summary.differenceAmount}
                  className={`text-sm font-black ${summary.differenceAmount === 0 ? "text-emerald-600" : "text-amber-600"}`}
                />
              </div>

              <div className="px-4 py-2 rounded-xl bg-background border border-default-100 shadow-2xs">
                <span className="text-[11px] text-default-500 font-medium block">نسبة المطابقة</span>
                <span className="text-sm font-black text-emerald-600">
                  {items.length > 0 ? Math.round((summary.reconciledCount / items.length) * 100) : 100}%
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-default-50/50 p-3 rounded-2xl border border-default-100">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="ابحث بالوصف أو المرجع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startContent={<Search className="h-4 w-4 text-default-400" />}
            size="sm"
            className="w-full sm:w-64"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant={filter === "all" ? "solid" : "flat"}
            color={filter === "all" ? "primary" : "default"}
            onPress={() => setFilter("all")}
          >
            الكل ({items.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "reconciled" ? "solid" : "flat"}
            color={filter === "reconciled" ? "success" : "default"}
            onPress={() => setFilter("reconciled")}
          >
            مُطابق ({summary.reconciledCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "unreconciled" ? "solid" : "flat"}
            color={filter === "unreconciled" ? "warning" : "default"}
            onPress={() => setFilter("unreconciled")}
          >
            غير مُطابق ({summary.unreconciledCount})
          </Button>
        </div>
      </div>

      {/* Bank Statement Items Table */}
      <Card className="border border-default-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-end text-xs">
            <thead className="bg-default-100/60 text-default-700 font-bold border-b border-default-100">
              <tr>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3 text-start">الوصف والمرجع</th>
                <th className="p-3">النوع</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">حالة المطابقة</th>
                <th className="p-3">المعاملة المقابلة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100 text-default-900 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-default-400">
                    لا توجد معاملات بنكية مطابقة لشروط البحث
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-default-50/50 transition-colors">
                    <td className="p-3 font-mono text-default-600 text-start">{item.date}</td>
                    <td className="p-3 text-start">
                      <div className="font-bold">{item.description}</div>
                      {item.reference && <div className="text-[11px] font-mono text-default-400">{item.reference}</div>}
                    </td>
                    <td className="p-3">
                      {item.type === "credit" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                          <ArrowDownLeft className="h-3 w-3" /> إيداع
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full text-[11px]">
                          <ArrowUpRight className="h-3 w-3" /> سحب
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold">
                      <MoneyAmount amount={Math.abs(item.amount)} />
                    </td>
                    <td className="p-3">
                      {item.status === "reconciled" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-xl">
                          <CheckCircle2 className="h-3.5 w-3.5" /> مُطابق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-500/15 px-2.5 py-1 rounded-xl">
                          <HelpCircle className="h-3.5 w-3.5" /> غير مُطابق
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-default-600">
                      {item.matchedTransactionId ? (
                        <span className="bg-default-100 px-2 py-1 rounded-lg">
                          {item.matchedTransactionId} ({item.matchedTransactionType})
                        </span>
                      ) : (
                        <span className="text-default-400 font-sans italic">غير مبرمج</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.status === "reconciled" ? (
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          className="h-7 text-xs font-bold"
                          onPress={() => unmatchItem(item.id)}
                        >
                          إلغاء المطابقة
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="h-7 text-xs font-bold"
                          onPress={() => handleOpenMatchModal(item)}
                        >
                          مطابقة الآن
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Match Transaction Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>
          <ModalHeader className="text-base font-black">مطابقة حركة كشف الحساب البنكي</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedItem && (
              <div className="p-3 rounded-xl bg-default-100/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-default-500">الوصف:</span>
                  <span className="font-bold">{selectedItem.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-default-500">المبلغ البنكي:</span>
                  <MoneyAmount amount={selectedItem.amount} className="font-bold text-primary" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Select
                label="نوع المعاملة الدفترية المقابلة"
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as any)}
                size="sm"
              >
                <SelectItem key="invoice">فاتورة مبيعات (Sales Invoice)</SelectItem>
                <SelectItem key="bill">فاتورة مشتريات (Supplier Bill)</SelectItem>
                <SelectItem key="voucher">سند قبض / صرف (Voucher)</SelectItem>
                <SelectItem key="journal">قيد يومية يدوي (Journal Entry)</SelectItem>
              </Select>

              <Input
                label="رمز المعاملة أو رقم المستند"
                value={matchTxId}
                onChange={(e) => setMatchTxId(e.target.value)}
                placeholder="مثال: INV-1002"
                size="sm"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>إلغاء</Button>
            <Button color="primary" onPress={handleConfirmMatch}>تأكيد المطابقة</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
