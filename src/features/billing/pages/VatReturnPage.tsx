import { useState, useMemo } from "react";
import { Button, Card, CardBody, Select, SelectItem, Spinner } from "@heroui/react";
import { FileText, Download, Calendar, ArrowUpRight, ArrowDownLeft, Scale } from "lucide-react";
import { toast } from "sonner";
import { AccountingPageHeader } from "../components/accounting-ui";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import {
  getDateRangeBounds,
  type DateRangePreset,
} from "../utils/date-range-utils";
import { computeVatReturnReport } from "../utils/vat-return-utils";

export default function VatReturnPage() {
  const [preset, setPreset] = useState<DateRangePreset>("this_quarter");
  const { data: invoices = [], isLoading: isLoadingInv } = useInvoices();
  const { data: bills = [], isLoading: isLoadingBills } = useBills();

  const { startDate, endDate } = useMemo(
    () => getDateRangeBounds(preset),
    [preset]
  );

  const report = useMemo(
    () => computeVatReturnReport(invoices, bills, startDate, endDate),
    [invoices, bills, startDate, endDate]
  );

  const isLoading = isLoadingInv || isLoadingBills;

  const handleExportCsv = () => {
    let csv = `رمز البند,اسم البند,المبلغ الخاضع للضريبة,ضريبة القيمة المضافة\n`;
    csv += `--- المبيعات والإيرادات (Output VAT) ---\n`;
    report.outputBoxes.forEach((b) => {
      csv += `"${b.code}","${b.titleAr}",${b.taxableAmount.toFixed(2)},${b.vatAmount.toFixed(2)}\n`;
    });
    csv += `إجمالي المبيعات والضريبة المحصلة,,${report.totalOutputTaxable.toFixed(2)},${report.totalOutputVat.toFixed(2)}\n\n`;

    csv += `--- المشتريات والمصاريف (Input VAT) ---\n`;
    report.inputBoxes.forEach((b) => {
      csv += `"${b.code}","${b.titleAr}",${b.taxableAmount.toFixed(2)},${b.vatAmount.toFixed(2)}\n`;
    });
    csv += `إجمالي المشتريات والضريبة المخصومة,,${report.totalInputTaxable.toFixed(2)},${report.totalInputVat.toFixed(2)}\n\n`;

    csv += `صافي الضريبة المستحقة للسداد / (الاسترداد),,,${report.netVatPayable.toFixed(2)}\n`;

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vat-declaration-${preset}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("تم تصدير الإقرار الضريبي بنجاح");
  };

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="تقرير الإقرار الضريبي (VAT Declaration Return)"
        description="تقرير مالي تفصيلي لمخرجات ومدخلات ضريبة القيمة المضافة طبقاً لنموذج هيئة الزكاة والضريبة والجمارك ZATCA"
        breadcrumbItems={[
          { label: "المحاسبة", to: "/billing" },
          { label: "التقارير", to: "/billing/reports" },
          { label: "الإقرار الضريبي" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <Select
              size="sm"
              selectedKeys={[preset]}
              onSelectionChange={(keys) => setPreset(Array.from(keys)[0] as DateRangePreset)}
              className="w-48"
              startContent={<Calendar className="h-4 w-4 text-default-400" />}
              aria-label="الفترة المالية"
            >
              <SelectItem key="all">جميع الفترات</SelectItem>
              <SelectItem key="this_month">الشهر الحالي</SelectItem>
              <SelectItem key="last_month">الشهر السابق</SelectItem>
              <SelectItem key="this_quarter">الربع الحالي (Q)</SelectItem>
              <SelectItem key="this_year">السنة الحالية</SelectItem>
            </Select>

            <Button
              color="primary"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExportCsv}
            >
              تصدير الإقرار (CSV)
            </Button>
          </div>
        }
      />

      {/* Summary Kpi Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-default-500 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-danger" /> ضريبة المبيعات المحصلة (Output VAT)
              </p>
              <h3 className="text-xl font-bold text-default-900 mt-1">
                <MoneyAmount amount={report.totalOutputVat} />
              </h3>
              <p className="text-xs text-default-400 mt-1">
                من إجمالي مبيعات: <MoneyAmount amount={report.totalOutputTaxable} />
              </p>
            </div>
            <div className="p-3 bg-danger/10 text-danger rounded-full">
              <FileText className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-default-500 flex items-center gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5 text-success" /> ضريبة المشتريات المخصومة (Input VAT)
              </p>
              <h3 className="text-xl font-bold text-default-900 mt-1">
                <MoneyAmount amount={report.totalInputVat} />
              </h3>
              <p className="text-xs text-default-400 mt-1">
                من إجمالي مشتريات: <MoneyAmount amount={report.totalInputTaxable} />
              </p>
            </div>
            <div className="p-3 bg-success/10 text-success rounded-full">
              <FileText className="h-6 w-6" />
            </div>
          </CardBody>
        </Card>

        <Card className={`border shadow-sm ${report.netVatPayable >= 0 ? "border-primary/30 bg-primary/5" : "border-success/30 bg-success/5"}`}>
          <CardBody className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-default-600 flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-primary" /> صافي الضريبة المستحقة للسداد / (الاسترداد)
              </p>
              <h3 className={`text-2xl font-black mt-1 ${report.netVatPayable >= 0 ? "text-primary" : "text-success"}`}>
                <MoneyAmount amount={report.netVatPayable} />
              </h3>
              <span className="inline-block text-[11px] font-semibold mt-1 px-2 py-0.5 rounded-full bg-content1 text-default-600">
                {report.netVatPayable >= 0 ? "مبلغ واجب الدفع للهيئة" : "مبلغ مسترد للمنشأة"}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Output Tax Section */}
          <div className="p-5 rounded-xl border border-default-200 bg-content1 shadow-sm">
            <h3 className="text-sm font-bold text-default-900 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger"></span>
              أولاً: المبيعات والإيرادات (ضريبة المخرجات - Output VAT)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-default-200 bg-default-100/60 font-semibold text-default-700">
                    <th className="py-2.5 px-3">رقم الخانة</th>
                    <th className="py-2.5 px-3">بيان الخانة الإقرارية</th>
                    <th className="py-2.5 px-3 text-left">المبلغ الخاضع للضريبة (SAR)</th>
                    <th className="py-2.5 px-3 text-left">مبلغ الضريبة (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default-100">
                  {report.outputBoxes.map((box) => (
                    <tr key={box.code} className="hover:bg-default-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-default-500">{box.code}</td>
                      <td className="py-2.5 px-3 font-medium text-default-900">{box.titleAr}</td>
                      <td className="py-2.5 px-3 text-left font-mono"><MoneyAmount amount={box.taxableAmount} /></td>
                      <td className="py-2.5 px-3 text-left font-mono font-bold text-danger"><MoneyAmount amount={box.vatAmount} /></td>
                    </tr>
                  ))}
                  <tr className="bg-default-100/80 font-bold text-default-900 border-t-2 border-default-200">
                    <td colSpan={2} className="py-3 px-3">إجمالي المبيعات والضريبة المحصلة</td>
                    <td className="py-3 px-3 text-left font-mono"><MoneyAmount amount={report.totalOutputTaxable} /></td>
                    <td className="py-3 px-3 text-left font-mono text-danger"><MoneyAmount amount={report.totalOutputVat} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Input Tax Section */}
          <div className="p-5 rounded-xl border border-default-200 bg-content1 shadow-sm">
            <h3 className="text-sm font-bold text-default-900 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success"></span>
              ثانياً: المشتريات والمصاريف (ضريبة المدخلات - Input VAT)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-default-200 bg-default-100/60 font-semibold text-default-700">
                    <th className="py-2.5 px-3">رقم الخانة</th>
                    <th className="py-2.5 px-3">بيان الخانة الإقرارية</th>
                    <th className="py-2.5 px-3 text-left">المبلغ الخاضع للضريبة (SAR)</th>
                    <th className="py-2.5 px-3 text-left">مبلغ الضريبة المستردة (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default-100">
                  {report.inputBoxes.map((box) => (
                    <tr key={box.code} className="hover:bg-default-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-default-500">{box.code}</td>
                      <td className="py-2.5 px-3 font-medium text-default-900">{box.titleAr}</td>
                      <td className="py-2.5 px-3 text-left font-mono"><MoneyAmount amount={box.taxableAmount} /></td>
                      <td className="py-2.5 px-3 text-left font-mono font-bold text-success"><MoneyAmount amount={box.vatAmount} /></td>
                    </tr>
                  ))}
                  <tr className="bg-default-100/80 font-bold text-default-900 border-t-2 border-default-200">
                    <td colSpan={2} className="py-3 px-3">إجمالي المشتريات والضريبة المخصومة</td>
                    <td className="py-3 px-3 text-left font-mono"><MoneyAmount amount={report.totalInputTaxable} /></td>
                    <td className="py-3 px-3 text-left font-mono text-success"><MoneyAmount amount={report.totalInputVat} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Net Tax Result Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-default-900 to-default-800 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold">صافي الضريبة المستحقة عن الفترة</h4>
              <p className="text-xs text-default-300 mt-1">
                الفرق بين ضريبة المبيعات المحصلة وضريبة المشتريات القابلة للخصم.
              </p>
            </div>
            <div className="text-left font-mono font-black text-2xl px-5 py-2.5 bg-white/10 rounded-xl border border-white/20">
              <MoneyAmount amount={report.netVatPayable} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
