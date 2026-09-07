import type { Invoice } from "../schemas/invoice";
import type { Bill } from "../schemas/bill";
import { isDateWithinRange } from "./date-range-utils";

export interface VatBox {
  code: string;
  titleAr: string;
  titleEn: string;
  taxableAmount: number;
  vatAmount: number;
}

export interface VatReturnReportData {
  periodLabel: string;
  outputBoxes: VatBox[]; // ضريبة المبيعات والإيرادات
  totalOutputTaxable: number;
  totalOutputVat: number;

  inputBoxes: VatBox[]; // ضريبة المشتريات والمصاريف
  totalInputTaxable: number;
  totalInputVat: number;

  netVatPayable: number; // صافي الضريبة المستحقة للسداد أو الاسترداد
}

export function computeVatReturnReport(
  invoices: Invoice[],
  bills: Bill[],
  startDate?: Date | null,
  endDate?: Date | null
): VatReturnReportData {
  const filteredInvoices = invoices.filter((inv) =>
    inv.status !== "draft" && inv.status !== "cancelled" &&
    isDateWithinRange(inv.issueDate, startDate, endDate)
  );

  const filteredBills = bills.filter((b) =>
    b.status !== "draft" && b.status !== "cancelled" &&
    isDateWithinRange(b.issueDate, startDate, endDate)
  );

  // 1. Output Tax (المبيعات والإيرادات)
  let sales15Taxable = 0;
  let sales15Vat = 0;
  let salesZeroTaxable = 0;
  let salesExemptTaxable = 0;

  for (const inv of filteredInvoices) {
    for (const item of inv.items) {
      const taxRate = item.taxRate ?? 0;
      const lineNet = (item.quantity * item.unitPrice) - (item.discount ?? 0);
      const lineVat = lineNet * (taxRate / 100);

      if (taxRate > 0) {
        sales15Taxable += lineNet;
        sales15Vat += lineVat;
      } else if (taxRate === 0) {
        salesZeroTaxable += lineNet;
      } else {
        salesExemptTaxable += lineNet;
      }
    }
  }

  const outputBoxes: VatBox[] = [
    {
      code: "1",
      titleAr: "المبيعات الخاضعة للنسبة الأساسية (15%)",
      titleEn: "Standard rated sales (15%)",
      taxableAmount: sales15Taxable,
      vatAmount: sales15Vat,
    },
    {
      code: "2",
      titleAr: "المبيعات للمواطنين (الخدمات الصحية والتعليمية الأهلية)",
      titleEn: "Sales to citizens (Health/Education)",
      taxableAmount: 0,
      vatAmount: 0,
    },
    {
      code: "3",
      titleAr: "المبيعات الخاضعة للنسبة الصفرية (0% - الصادرات والخدمات الدولية)",
      titleEn: "Zero rated sales (0%)",
      taxableAmount: salesZeroTaxable,
      vatAmount: 0,
    },
    {
      code: "4",
      titleAr: "المبيعات المعفاة من الضريبة",
      titleEn: "Exempt sales",
      taxableAmount: salesExemptTaxable,
      vatAmount: 0,
    },
  ];

  const totalOutputTaxable = outputBoxes.reduce((sum, b) => sum + b.taxableAmount, 0);
  const totalOutputVat = outputBoxes.reduce((sum, b) => sum + b.vatAmount, 0);

  // 2. Input Tax (المشتريات والمصاريف)
  let purchases15Taxable = 0;
  let purchases15Vat = 0;
  let purchasesZeroTaxable = 0;

  for (const bill of filteredBills) {
    for (const item of bill.items) {
      const taxRate = item.taxRate ?? 0;
      const lineNet = item.quantity * item.unitPrice;
      const lineVat = lineNet * (taxRate / 100);

      if (taxRate > 0) {
        purchases15Taxable += lineNet;
        purchases15Vat += lineVat;
      } else {
        purchasesZeroTaxable += lineNet;
      }
    }
  }

  const inputBoxes: VatBox[] = [
    {
      code: "5",
      titleAr: "المشتريات الخاضعة للنسبة الأساسية (15%)",
      titleEn: "Standard rated purchases (15%)",
      taxableAmount: purchases15Taxable,
      vatAmount: purchases15Vat,
    },
    {
      code: "6",
      titleAr: "الاستيرادات الخاضعة للضريبة بمنافذ الجمارك",
      titleEn: "Imports subject to VAT paid at customs",
      taxableAmount: 0,
      vatAmount: 0,
    },
    {
      code: "7",
      titleAr: "المشتريات الخاضعة للنسبة الصفرية أو المعفاة",
      titleEn: "Zero rated and exempt purchases",
      taxableAmount: purchasesZeroTaxable,
      vatAmount: 0,
    },
  ];

  const totalInputTaxable = inputBoxes.reduce((sum, b) => sum + b.taxableAmount, 0);
  const totalInputVat = inputBoxes.reduce((sum, b) => sum + b.vatAmount, 0);

  const netVatPayable = totalOutputVat - totalInputVat;

  return {
    periodLabel: startDate && endDate
      ? `${startDate.toLocaleDateString("ar-SA")} - ${endDate.toLocaleDateString("ar-SA")}`
      : "جميع الفترات",
    outputBoxes,
    totalOutputTaxable,
    totalOutputVat,
    inputBoxes,
    totalInputTaxable,
    totalInputVat,
    netVatPayable,
  };
}
