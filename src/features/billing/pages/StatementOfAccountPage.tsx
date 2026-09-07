import { useState, useMemo } from "react";
import { Button, Select, SelectItem } from "@heroui/react";
import { Printer, Calendar, User } from "lucide-react";
import { AccountingPageHeader } from "../components/accounting-ui";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import { useInvoices } from "../hooks/use-invoices";
import { useBills } from "../hooks/use-bills";
import { useCreditNotes } from "../hooks/use-credit-notes";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import {
  getDateRangeBounds,
  type DateRangePreset,
} from "../utils/date-range-utils";

export interface StatementRow {
  id: string;
  date: Date;
  docNumber: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function StatementOfAccountPage() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [preset, setPreset] = useState<DateRangePreset>("all");

  const { data: contactsRes, isLoading: isLoadingContacts } = useContactsQuery();
  const contacts = contactsRes?.data ?? [];

  const { data: invoices = [] } = useInvoices();
  const { data: bills = [] } = useBills();
  const { data: creditNotes = [] } = useCreditNotes();

  const { startDate, endDate } = useMemo(
    () => getDateRangeBounds(preset),
    [preset]
  );

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedPartnerId),
    [contacts, selectedPartnerId]
  );

  const statementData = useMemo(() => {
    if (!selectedPartnerId) {
      return { openingBalance: 0, rows: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };
    }

    const rawRows: { date: Date; docNumber: string; type: string; description: string; debit: number; credit: number }[] = [];

    const contactName = selectedContact ? contactDisplayName(selectedContact) : "";

    // Customer Invoices
    for (const inv of invoices) {
      if (inv.customerId === selectedPartnerId || (contactName && inv.customerName === contactName)) {
        rawRows.push({
          date: new Date(inv.issueDate),
          docNumber: inv.invoiceNumber,
          type: "فاتورة مبيعات",
          description: inv.notes || "فاتورة مبيعات",
          debit: inv.grandTotal,
          credit: 0,
        });

        if ((inv.amountPaid ?? 0) > 0) {
          rawRows.push({
            date: new Date(inv.issueDate),
            docNumber: `REC-${inv.invoiceNumber}`,
            type: "دفعة سداد (قبض)",
            description: "سداد فاتورة مبيعات",
            debit: 0,
            credit: inv.amountPaid!,
          });
        }
      }
    }

    // Vendor Bills
    for (const b of bills) {
      if (b.vendorId === selectedPartnerId || (contactName && b.vendorName === contactName)) {
        rawRows.push({
          date: new Date(b.issueDate),
          docNumber: b.billNumber,
          type: "فاتورة شراء",
          description: b.notes || "فاتورة مشتريات",
          debit: 0,
          credit: b.grandTotal,
        });

        if ((b.amountPaid ?? 0) > 0) {
          rawRows.push({
            date: new Date(b.issueDate),
            docNumber: `PAY-${b.billNumber}`,
            type: "دفعة سداد (صرف)",
            description: "سداد فاتورة شراء",
            debit: b.amountPaid!,
            credit: 0,
          });
        }
      }
    }

    // Credit Notes & Debit Notes
    for (const cn of creditNotes) {
      if (cn.partnerId === selectedPartnerId || (contactName && cn.partnerName === contactName)) {
        if (cn.type === "credit_note") {
          rawRows.push({
            date: new Date(cn.date),
            docNumber: cn.noteNumber,
            type: "إشعار دائن (مرتجع)",
            description: cn.reason || "مرتجع مبيعات",
            debit: 0,
            credit: cn.grandTotal,
          });
        } else {
          rawRows.push({
            date: new Date(cn.date),
            docNumber: cn.noteNumber,
            type: "إشعار مدين (مرتجع)",
            description: cn.reason || "مرتجع مشتريات",
            debit: cn.grandTotal,
            credit: 0,
          });
        }
      }
    }

    // Sort by date ascending
    rawRows.sort((a, b) => a.date.getTime() - b.date.getTime());

    let openingBalance = 0;
    const periodRows: StatementRow[] = [];
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of rawRows) {
      if (startDate && item.date < startDate) {
        openingBalance += item.debit - item.credit;
      } else if (!endDate || item.date <= endDate) {
        if (periodRows.length === 0) {
          runningBalance = openingBalance;
        }
        runningBalance += item.debit - item.credit;
        totalDebit += item.debit;
        totalCredit += item.credit;

        periodRows.push({
          id: `${item.docNumber}-${Math.random().toString(36).slice(2, 7)}`,
          date: item.date,
          docNumber: item.docNumber,
          type: item.type,
          description: item.description,
          debit: item.debit,
          credit: item.credit,
          balance: runningBalance,
        });
      }
    }

    const closingBalance = (periodRows.length > 0 ? periodRows[periodRows.length - 1].balance : openingBalance);

    return { openingBalance, rows: periodRows, totalDebit, totalCredit, closingBalance };
  }, [invoices, bills, creditNotes, selectedPartnerId, selectedContact, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <AccountingPageHeader
          title="كشف حساب تفصيلي (Statement of Account)"
          description="عرض حركة الحساب التفصيلية للعميل أو المورد والرصيد التراكمي"
          breadcrumbItems={[
            { label: "المحاسبة", to: "/billing" },
            { label: "التقارير", to: "/billing/reports" },
            { label: "كشف حساب تفصيلي" },
          ]}
          action={
            <Button
              color="primary"
              variant="flat"
              startContent={<Printer className="h-4 w-4" />}
              onPress={handlePrint}
              isDisabled={!selectedPartnerId}
            >
              طباعة كشف الحساب
            </Button>
          }
        />
      </div>

      {/* Select Controls */}
      <div className="p-4 rounded-xl border border-default-200 bg-content1 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <Select
          label="اختر العميل أو المورد"
          placeholder="ابحث بالاسم أو الشركة..."
          selectedKeys={selectedPartnerId ? [selectedPartnerId] : []}
          onSelectionChange={(keys) => setSelectedPartnerId(Array.from(keys)[0] as string)}
          className="max-w-md"
          startContent={<User className="h-4 w-4 text-default-400" />}
          isLoading={isLoadingContacts}
        >
          {contacts.map((c) => (
            <SelectItem key={c.id} textValue={contactDisplayName(c)}>
              {contactDisplayName(c)} {c.accountName ? `(${c.accountName})` : ""}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="النطاق الزمني"
          selectedKeys={[preset]}
          onSelectionChange={(keys) => setPreset(Array.from(keys)[0] as DateRangePreset)}
          className="w-48"
          startContent={<Calendar className="h-4 w-4 text-default-400" />}
        >
          <SelectItem key="all">جميع الفترات</SelectItem>
          <SelectItem key="this_month">الشهر الحالي</SelectItem>
          <SelectItem key="last_month">الشهر السابق</SelectItem>
          <SelectItem key="this_quarter">الربع الحالي (Q)</SelectItem>
          <SelectItem key="this_year">السنة الحالية</SelectItem>
        </Select>
      </div>

      {!selectedPartnerId ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-default-200 bg-default-50 print:hidden">
          <User className="h-12 w-12 text-default-300 mb-3" />
          <p className="font-semibold text-default-700">يرجى اختيار عميل أو مورد لعرض كشف الحساب</p>
          <p className="text-xs text-default-500 mt-1 max-w-sm">
            اختر الاسم من القائمة أعلاه لتوليد تقرير كشف الحساب المفصل والرصيد المتراكم.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header info card */}
          <div className="p-6 rounded-xl border border-default-200 bg-content1 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-default-400 font-bold uppercase tracking-wider">كشف حساب مالي تفصيلي</span>
              <h2 className="text-xl font-bold text-default-900 mt-1">{contactDisplayName(selectedContact!)}</h2>
              {selectedContact?.accountName && (
                <p className="text-xs text-default-500">{selectedContact.accountName}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="text-left">
                <span className="text-xs text-default-400">إجمالي المدين (+)</span>
                <p className="font-mono font-bold text-base text-danger"><MoneyAmount amount={statementData.totalDebit} /></p>
              </div>
              <div className="text-left">
                <span className="text-xs text-default-400">إجمالي الدائن (-)</span>
                <p className="font-mono font-bold text-base text-success"><MoneyAmount amount={statementData.totalCredit} /></p>
              </div>
              <div className="text-left p-3 rounded-lg bg-default-100 border border-default-200">
                <span className="text-xs text-default-600 font-bold">الرصيد النهائي الحالي</span>
                <p className={`font-mono font-black text-lg ${statementData.closingBalance >= 0 ? "text-primary" : "text-success"}`}>
                  <MoneyAmount amount={statementData.closingBalance} />
                </p>
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-default-200 bg-content1 shadow-sm">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-default-200 bg-default-100/70 font-semibold text-default-700">
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">رقم المستند</th>
                  <th className="py-3 px-4">نوع الحركة</th>
                  <th className="py-3 px-4">البيان / الوصف</th>
                  <th className="py-3 px-4 text-left">مدين (SAR)</th>
                  <th className="py-3 px-4 text-left">دائن (SAR)</th>
                  <th className="py-3 px-4 text-left">الرصيد المتراكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {/* Opening Balance Row */}
                <tr className="bg-default-50 font-semibold">
                  <td className="py-3 px-4 text-default-400">—</td>
                  <td className="py-3 px-4 font-mono text-default-400">—</td>
                  <td className="py-3 px-4 text-primary font-bold">الرصيد الافتتاحي</td>
                  <td className="py-3 px-4 text-default-500">رصيد ما قبل بداية الفترة المحددة</td>
                  <td className="py-3 px-4 text-left font-mono text-default-400">0.00</td>
                  <td className="py-3 px-4 text-left font-mono text-default-400">0.00</td>
                  <td className="py-3 px-4 text-left font-mono font-bold text-default-900">
                    <MoneyAmount amount={statementData.openingBalance} />
                  </td>
                </tr>

                {statementData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-default-400">
                      لا توجد حركات مالية مسجلة لهذا الحساب خلال الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  statementData.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-default-50/60 transition-colors">
                      <td className="py-3 px-4 text-default-600 font-medium">
                        {row.date.toLocaleDateString("ar-SA")}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-default-900">{row.docNumber}</td>
                      <td className="py-3 px-4 font-medium text-default-700">{row.type}</td>
                      <td className="py-3 px-4 text-default-600">{row.description}</td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-danger">
                        {row.debit > 0 ? <MoneyAmount amount={row.debit} /> : "—"}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-success">
                        {row.credit > 0 ? <MoneyAmount amount={row.credit} /> : "—"}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-black text-default-900">
                        <MoneyAmount amount={row.balance} />
                      </td>
                    </tr>
                  ))
                )}

                {/* Summary Closing Row */}
                <tr className="bg-default-100 font-bold text-default-900 border-t-2 border-default-200">
                  <td colSpan={4} className="py-3.5 px-4 text-base">الإجمالي والرصيد الإغلاقي النهائي</td>
                  <td className="py-3.5 px-4 text-left font-mono text-danger"><MoneyAmount amount={statementData.totalDebit} /></td>
                  <td className="py-3.5 px-4 text-left font-mono text-success"><MoneyAmount amount={statementData.totalCredit} /></td>
                  <td className="py-3.5 px-4 text-left font-mono text-primary text-sm font-black"><MoneyAmount amount={statementData.closingBalance} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
