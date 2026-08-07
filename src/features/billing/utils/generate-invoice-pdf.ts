import i18n from "@/lib/i18n";
import {
  generatePdfBlob,
  generateQuotationPdf,
} from "@/features/crm/utils/generate-quotation-pdf";

/**
 * Run work with UI language forced to Arabic so invoice PDFs
 * capture RTL labels (فاتورة ضريبية, البائع, العميل, …).
 */
export async function withArabicInvoiceLocale<T>(
  fn: () => Promise<T>
): Promise<T> {
  const prevLang = i18n.language;
  const prevDir = document.documentElement.dir;
  const prevHtmlLang = document.documentElement.lang;
  const needsSwitch = !prevLang.startsWith("ar");

  if (needsSwitch) {
    await i18n.changeLanguage("ar");
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    // Let React re-render InvoicePrintDocument with Arabic strings
    await new Promise((r) => setTimeout(r, 120));
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  }

  try {
    return await fn();
  } finally {
    if (needsSwitch) {
      await i18n.changeLanguage(prevLang);
      document.documentElement.dir = prevDir;
      document.documentElement.lang = prevHtmlLang;
    }
  }
}

/** Download invoice PDF always in Arabic layout. */
export async function generateInvoicePdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  await withArabicInvoiceLocale(() => generateQuotationPdf(element, filename));
}

/** Build invoice PDF blob always in Arabic layout. */
export async function generateInvoicePdfBlob(
  element: HTMLElement
): Promise<Blob> {
  return withArabicInvoiceLocale(() => generatePdfBlob(element));
}
