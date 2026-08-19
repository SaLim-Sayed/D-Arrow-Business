import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useVoucher } from "../hooks/use-vouchers";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { useCompanyProfile } from "@/features/companies/hooks/use-company-profile";
import { VoucherPrintDocument } from "../components/VoucherPrintDocument";
import { generateInvoicePdf } from "../utils/generate-invoice-pdf";
import {
  voucherListPath,
  type VoucherType,
} from "../schemas/voucher";
import { BillingMoney } from "../components/BillingMoney";
import { billingDateLocale } from "../utils/locale";
import { AccountingPageHeader } from "../components/accounting-ui";

export default function VoucherDetailPage({ type }: { type: VoucherType }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("billing");
  const { data: voucher, isLoading } = useVoucher(id);
  const { data: settings } = useBillingSettings();
  const { data: company } = useCompanyProfile();
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const dateLocale = billingDateLocale(i18n.language);

  const resolvedType = voucher?.voucherType ?? type;
  const typeKey = resolvedType === "receipt" ? "receipt" : "disbursement";

  const handleDownloadPdf = async () => {
    if (!printRef.current || !voucher) return;
    setExporting(true);
    try {
      await generateInvoicePdf(
        printRef.current,
        `${voucher.voucherNumber}.pdf`
      );
    } catch {
      toast.error(t("vouchers.pdf_failed"));
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="p-10 text-center text-default-500">
        {t("vouchers.not_found")}
      </div>
    );
  }

  const sourcePath = voucher.invoiceId
    ? `/billing/invoices/${voucher.invoiceId}`
    : voucher.billId
      ? `/billing/bills/${voucher.billId}`
      : null;
  const sourceNumber = voucher.invoiceNumber || voucher.billNumber;

  return (
    <div className="mx-auto max-w-[220mm] space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="print:hidden">
        <AccountingPageHeader
          title={voucher.voucherNumber}
          description={`${t(`vouchers.${typeKey}.print_title`)} · ${voucher.date.toLocaleDateString(dateLocale)}`}
          breadcrumbItems={[
            { label: t("module_name"), to: "/billing" },
            {
              label: t(`vouchers.${typeKey}.title`),
              to: voucherListPath(resolvedType),
            },
            { label: voucher.voucherNumber },
          ]}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="flat"
                startContent={<ArrowLeft className="h-4 w-4 rtl:rotate-180" />}
                onPress={() => navigate(voucherListPath(resolvedType))}
              >
                {t("actions.back")}
              </Button>
              <Button
                variant="flat"
                isIconOnly
                aria-label={t("actions.download_pdf")}
                isLoading={exporting}
                onPress={handleDownloadPdf}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="flat"
                isIconOnly
                aria-label={t("actions.print")}
                onPress={() => window.print()}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </div>

      <div className="print:hidden rounded-lg border border-default-200 bg-content1 p-4 text-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-default-400">
              {t(`vouchers.${typeKey}.party`)}
            </p>
            <p className="mt-1 font-medium">{voucher.partyName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-default-400">
              {t("vouchers.columns.source")}
            </p>
            <p className="mt-1 font-mono">
              {sourcePath && sourceNumber ? (
                <Link to={sourcePath} className="text-primary hover:underline">
                  {sourceNumber}
                </Link>
              ) : (
                sourceNumber || "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-default-400">
              {t("vouchers.print.amount")}
            </p>
            <p className="mt-1 text-lg font-bold">
              <BillingMoney
                amount={voucher.amount}
                currency={voucher.currency}
                className={
                  resolvedType === "receipt" ? "text-success" : "text-danger"
                }
              />
            </p>
          </div>
        </div>
      </div>

      <div
        ref={printRef}
        className="overflow-x-auto rounded-lg border border-default-200 bg-default-50/50 p-2 shadow-sm print:border-none print:bg-white print:p-0 print:shadow-none"
      >
        <VoucherPrintDocument
          voucher={voucher}
          settings={settings}
          company={company}
        />
      </div>
    </div>
  );
}
