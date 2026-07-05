import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Chip } from "@heroui/react";
import {
  Printer,
  Download,
  ArrowLeft,
  Mail,
  CreditCard,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { useInvoice } from "../hooks/use-invoices";
import { usePayments } from "../hooks/use-payments";
import { useContactsQuery } from "@/features/crm/hooks/use-contacts";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { useCompanyProfile } from "@/features/companies/hooks/use-company-profile";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { InvoicePrintDocument } from "../components/InvoicePrintDocument";
import { generateQuotationPdf } from "@/features/crm/utils/generate-quotation-pdf";
import { formatCurrency } from "@/lib/utils";
import { BillingMoney } from "../components/BillingMoney";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { billingDateLocale } from "../utils/locale";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("billing");
  const printRef = useRef<HTMLDivElement>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dateLocale = billingDateLocale(i18n.language);

  const { data: invoice, isLoading } = useInvoice(id);
  const { data: payments = [] } = usePayments(id);
  const { data: contactsRes } = useContactsQuery();
  const contacts = contactsRes?.data || [];
  const { data: settings } = useBillingSettings();
  const { data: company } = useCompanyProfile();

  const customer = contacts.find((c) => c.id === invoice?.customerId);

  if (isLoading) {
    return (
      <div className="p-10 text-center text-default-500">
        {t("invoices.detail.loading")}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center p-10">
        <p className="text-default-500">{t("invoices.detail.invoice_not_found")}</p>
      </div>
    );
  }

  const amountDue = getInvoiceAmountDue(invoice);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "sent":
        return "primary";
      case "paid":
        return "success";
      case "overdue":
        return "danger";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      await generateQuotationPdf(
        printRef.current,
        `${invoice.invoiceNumber}.pdf`,
      );
    } catch {
      toast.error(t("invoices.detail.pdf_failed"));
    } finally {
      setExporting(false);
    }
  };

  const handleSendEmail = () => {
    if (!customer?.email) {
      toast.error(t("invoices.detail.no_email"));
      return;
    }
    const subject = encodeURIComponent(
      t("invoices.detail.email_subject", { number: invoice.invoiceNumber })
    );
    const body = encodeURIComponent(
      t("invoices.detail.email_body", {
        number: invoice.invoiceNumber,
        amount: formatCurrency(invoice.grandTotal, invoice.currency),
      })
    );
    window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`);
    toast.success(t("invoices.detail.email_opened"));
  };

  return (
    <div className="mx-auto max-w-[220mm] space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-default-100 bg-background/80 py-4 backdrop-blur-md print:hidden">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            aria-label={t("actions.back")}
            onPress={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
              <span dir="ltr">{invoice.invoiceNumber}</span>
              <Chip
                color={getStatusColor(invoice.status)}
                variant="flat"
                size="sm"
                className="font-bold text-[10px]"
              >
                {t(`invoices.status.${invoice.status}`)}
              </Chip>
              {invoice.totalTax > 0 &&
                invoice.status !== "draft" &&
                settings?.companyProfile?.taxNumber && (
                  <span className="rounded bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                    {t("daftra.zatca.badge")}
                  </span>
                )}
            </h1>
            <p className="text-sm text-default-500">
              {t("invoices.detail.issue_date")}:{" "}
              {invoice.issueDate.toLocaleDateString(dateLocale)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {invoice.status === "draft" && (
            <Button
              color="primary"
              variant="flat"
              startContent={<Edit2 className="h-4 w-4" />}
              onPress={() => navigate(`/billing/invoices/${invoice.id}/edit`)}
            >
              {t("invoices.detail.edit_invoice")}
            </Button>
          )}
          {amountDue > 0 &&
            invoice.status !== "draft" &&
            invoice.status !== "cancelled" && (
              <Button
                color="success"
                variant="flat"
                startContent={<CreditCard className="h-4 w-4" />}
                onPress={() => setPaymentOpen(true)}
              >
                {t("invoices.detail.record_payment")}
              </Button>
            )}
          <Button
            variant="flat"
            startContent={<Mail className="h-4 w-4" />}
            onPress={handleSendEmail}
          >
            {t("invoices.detail.send_email")}
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
      </div>

      <div
        ref={printRef}
        className="overflow-x-auto rounded-lg border border-default-200 bg-default-50/50 p-2 shadow-sm print:border-none print:bg-white print:p-0 print:shadow-none"
      >
        <InvoicePrintDocument
          invoice={invoice}
          settings={settings}
          company={company}
          customer={customer}
          amountDue={amountDue}
        />
      </div>

      {payments.length > 0 && (
        <div className="rounded-lg border border-default-200 bg-content1 p-4 print:hidden">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-default-400">
            {t("payments.history")}
          </h4>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {p.date.toLocaleDateString(dateLocale)}
                  {p.methodName ? ` — ${p.methodName}` : ""}
                  {p.reference ? ` (${p.reference})` : ""}
                </span>
                <BillingMoney
                  amount={p.amount}
                  currency={p.currency}
                  className="font-medium text-success"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <RecordPaymentModal
        invoice={invoice}
        isOpen={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </div>
  );
}
