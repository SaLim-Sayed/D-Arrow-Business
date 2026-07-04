import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Button, Chip, Divider } from "@heroui/react";
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
import { contactDisplayName } from "@/features/crm/utils/contacts-list.utils";
import { useBillingSettings } from "../hooks/use-billing-settings";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { generateQuotationPdf } from "@/features/crm/utils/generate-quotation-pdf";
import { formatCurrency } from "@/lib/utils";
import { getInvoiceAmountDue } from "../utils/accounting-engine";
import { QRCodeCanvas } from "qrcode.react";
import { generateZatcaQr } from "../utils/zatca";
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

  const customer = contacts.find((c) => c.id === invoice?.customerId);
  const companyName = settings?.companyProfile?.name || "D-Arrow Business";
  const companyAddress = settings?.companyProfile?.address;

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
    <div className="mx-auto max-w-4xl space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-default-100 bg-background/80 py-4 backdrop-blur-md">
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

      <div ref={printRef}>
        <Card
          className="print:shadow-none print:border-none shadow-sm border border-default-100 rounded-none sm:rounded-2xl bg-white dark:bg-content1 overflow-hidden min-h-[800px]"
          data-invoice-print
        >
          <CardBody className="p-0">
            <div
              className={`h-2 w-full bg-${getStatusColor(invoice.status)}`}
            />

            <div className="p-8 md:p-12 space-y-12">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-default-900">
                    {t("invoices.detail.document_title")}
                  </h2>
                  <p className="mt-1 font-medium text-default-500" dir="ltr">
                    # {invoice.invoiceNumber}
                  </p>
                </div>
                <div className="flex items-start gap-6">
                  <div className="text-end">
                    <h3 className="text-xl font-bold tracking-tight text-primary">
                      {companyName}
                    </h3>
                    {companyAddress && (
                      <p className="mt-1 whitespace-pre-line text-sm text-default-500">
                        {companyAddress}
                      </p>
                    )}
                    {settings?.companyProfile?.taxNumber && (
                      <p className="mt-1 font-mono text-sm text-default-500">
                        {t("invoices.detail.vat_number")}:{" "}
                        <span dir="ltr">{settings.companyProfile.taxNumber}</span>
                      </p>
                    )}
                  </div>
                  {settings?.companyProfile?.taxNumber && (
                    <div className="bg-white p-2 rounded-lg border border-default-100 shrink-0 shadow-sm">
                      <QRCodeCanvas
                        value={generateZatcaQr(
                          companyName,
                          settings.companyProfile.taxNumber,
                          invoice.issueDate.toISOString(),
                          invoice.grandTotal,
                          invoice.totalTax,
                        )}
                        size={100}
                        level="M"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-default-400">
                    {t("invoices.detail.bill_to")}
                  </h4>
                  <h5 className="text-lg font-bold text-default-900">
                    {customer
                      ? contactDisplayName(customer)
                      : t("invoices.detail.unknown_customer")}
                  </h5>
                  <p className="text-default-500 text-sm mt-1">
                    {customer?.email}
                    <br />
                    {customer?.phone}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-default-400">
                      {t("invoices.detail.issue_date")}
                    </h4>
                    <p className="font-medium text-default-900">
                      {invoice.issueDate.toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-default-400">
                      {t("invoices.detail.due_date")}
                    </h4>
                    <p className="font-medium text-default-900">
                      {invoice.dueDate.toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-default-100 bg-default-100/50 p-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-default-500">
                      {t("invoices.detail.amount_due")}
                    </h4>
                    <p className="text-xl font-black text-primary" dir="ltr">
                      {formatCurrency(amountDue, invoice.currency)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <table className="w-full border-collapse text-start">
                  <thead>
                    <tr className="border-b-2 border-default-200">
                      <th className="w-[50%] py-3 text-xs font-bold uppercase tracking-widest text-default-500">
                        {t("invoices.detail.item_description")}
                      </th>
                      <th className="py-3 text-end text-xs font-bold uppercase tracking-widest text-default-500">
                        {t("invoices.detail.qty")}
                      </th>
                      <th className="py-3 text-end text-xs font-bold uppercase tracking-widest text-default-500">
                        {t("invoices.detail.rate")}
                      </th>
                      <th className="py-3 text-end text-xs font-bold uppercase tracking-widest text-default-500">
                        {t("invoices.detail.amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4">
                          <p className="font-medium text-default-900">
                            {item.description}
                          </p>
                          {item.discount > 0 && (
                            <span className="text-xs text-danger">
                              {t("invoices.detail.line_discount")}:{" "}
                              <span dir="ltr">
                                {formatCurrency(item.discount, invoice.currency)}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-end tabular-nums text-default-600" dir="ltr">
                          {item.quantity}
                        </td>
                        <td className="py-4 text-end tabular-nums text-default-600" dir="ltr">
                          {formatCurrency(item.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-4 text-end font-medium tabular-nums text-default-900" dir="ltr">
                          {formatCurrency(item.total, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full space-y-3 md:w-1/2">
                  <div className="flex justify-between text-default-600">
                    <span>{t("invoices.detail.subtotal")}</span>
                    <span className="font-medium tabular-nums" dir="ltr">
                      {formatCurrency(invoice.subTotal, invoice.currency)}
                    </span>
                  </div>
                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-danger">
                      <span>{t("invoices.detail.total_discount")}</span>
                      <span dir="ltr">
                        -{formatCurrency(invoice.totalDiscount, invoice.currency)}
                      </span>
                    </div>
                  )}
                  {invoice.totalTax > 0 && (
                    <div className="flex justify-between text-default-600">
                      <span>{t("invoices.detail.total_tax")}</span>
                      <span className="font-medium tabular-nums" dir="ltr">
                        {formatCurrency(invoice.totalTax, invoice.currency)}
                      </span>
                    </div>
                  )}
                  <Divider className="my-2" />
                  <div className="flex items-center justify-between text-xl font-black text-default-900">
                    <span>{t("invoices.detail.total")}</span>
                    <span dir="ltr">
                      {formatCurrency(invoice.grandTotal, invoice.currency)}
                    </span>
                  </div>
                  {(invoice.amountPaid || 0) > 0 && (
                    <>
                      <div className="mt-2 flex items-center justify-between border-t border-dashed border-default-200 py-2 text-sm font-medium text-success">
                        <span>{t("invoices.detail.paid")}</span>
                        <span dir="ltr">
                          -{formatCurrency(invoice.amountPaid || 0, invoice.currency)}
                        </span>
                      </div>
                      <div className="-mx-4 mt-2 flex items-center justify-between rounded-xl border-t border-default-200 bg-primary/5 px-4 py-3 text-lg font-black text-primary">
                        <span>{t("invoices.detail.balance_due")}</span>
                        <span dir="ltr">
                          {formatCurrency(amountDue, invoice.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {payments.length > 0 && (
                <div className="border-t border-default-100 pt-6">
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
                        <span className="font-medium text-success" dir="ltr">
                          {formatCurrency(p.amount, p.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 space-y-6 border-t border-default-100 pt-12">
                {invoice.notes && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-default-400">
                      {t("invoices.detail.notes")}
                    </h4>
                    <p className="whitespace-pre-line text-sm text-default-600">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                {invoice.termsAndConditions && (
                  <div>
                    <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-default-400">
                      {t("invoices.detail.terms")}
                    </h4>
                    <p className="whitespace-pre-line text-xs text-default-500">
                      {invoice.termsAndConditions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <RecordPaymentModal
        invoice={invoice}
        isOpen={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </div>
  );
}
