import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@heroui/react";
import { Download, Printer } from "lucide-react";
import {
  base64ToPdfBlob,
  getInvoicePublicShare,
  hydrateInvoiceFromSnapshot,
  type InvoicePublicShare,
} from "../api/invoice-share.service";
import { InvoicePrintDocument } from "../components/InvoicePrintDocument";
import { generateQuotationPdf } from "@/features/crm/utils/generate-quotation-pdf";
import { invoicePdfShareUrl } from "../api/invoice-share.service";
import type { BillingSettings } from "../schemas/settings";

/**
 * Public (no sign-in) invoice page for QR scans.
 * Prefers snapshot HTML (always ready), then PDF file when available.
 */
export default function PublicInvoicePdfPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation("billing");
  const printRef = useRef<HTMLDivElement>(null);
  const [share, setShare] = useState<InvoicePublicShare | null>(null);
  const [error, setError] = useState<"missing" | "not_ready" | "failed" | null>(
    null
  );
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token?.trim()) {
      setError("missing");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      try {
        const data = await getInvoicePublicShare(token.trim());
        if (cancelled) return;

        const ready = !!(
          data?.snapshot ||
          data?.pdfUrl?.startsWith("http") ||
          data?.pdfBase64
        );

        if (data && ready) {
          setShare(data);

          // Auto-open hosted PDF when available (optional fast path)
          if (data.pdfUrl?.startsWith("http") && !data.snapshot) {
            window.location.replace(data.pdfUrl);
          }
          return;
        }

        attempts += 1;
        if (attempts < 12) {
          window.setTimeout(load, 600);
          return;
        }
        setError("not_ready");
      } catch {
        if (!cancelled) setError("failed");
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleDownloadPdf = async () => {
    if (!share) return;

    if (share.pdfUrl?.startsWith("http")) {
      window.open(share.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (share.pdfBase64) {
      const blob = base64ToPdfBlob(share.pdfBase64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${share.invoiceNumber || "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!printRef.current) return;
    setExporting(true);
    try {
      await generateQuotationPdf(
        printRef.current,
        `${share.invoiceNumber || "invoice"}.pdf`
      );
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-default-50 px-6 text-center">
        <p className="text-base font-bold text-default-800">
          {error === "not_ready"
            ? t("invoices.public.pdf_not_ready")
            : t("invoices.public.pdf_unavailable")}
        </p>
        <p className="max-w-sm text-sm text-default-500">
          {t("invoices.public.pdf_unavailable_hint")}
        </p>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-default-50">
        <Spinner size="lg" color="primary" />
        <p className="text-sm text-default-500">{t("invoices.public.opening_pdf")}</p>
        <p className="text-xs text-default-400">
          {t("invoices.public.no_signin_needed")}
        </p>
      </div>
    );
  }

  if (share.snapshot) {
    const hydrated = hydrateInvoiceFromSnapshot(share.snapshot);
    const shareUrl = token ? invoicePdfShareUrl(token) : undefined;

    return (
      <div className="min-h-dvh bg-default-50 pb-10">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-default-200 bg-content1/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-bold text-default-800" dir="ltr">
              {share.invoiceNumber}
            </p>
            <p className="text-xs text-default-400">
              {t("invoices.public.no_signin_needed")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              startContent={<Printer className="h-4 w-4" />}
              onPress={() => window.print()}
            >
              {t("invoices.detail.print")}
            </Button>
            <Button
              size="sm"
              color="primary"
              isLoading={exporting}
              startContent={<Download className="h-4 w-4" />}
              onPress={() => void handleDownloadPdf()}
            >
              {t("invoices.public.download_pdf")}
            </Button>
          </div>
        </div>

        <div
          ref={printRef}
          className="mx-auto max-w-[220mm] overflow-x-auto p-2 print:max-w-none print:p-0"
        >
          <InvoicePrintDocument
            invoice={{
              ...hydrated.invoice,
              customerName: share.snapshot.customerName,
            }}
            company={hydrated.company}
            customer={hydrated.customer}
            amountDue={hydrated.amountDue}
            settings={
              {
                companyProfile: {
                  name: share.snapshot.company.name,
                  address: share.snapshot.company.address || "—",
                  commercialRegister:
                    share.snapshot.company.commercialRegister,
                  taxNumber: share.snapshot.company.taxNumber,
                  phone: share.snapshot.company.phone,
                  email: share.snapshot.company.email,
                  logoUrl: share.snapshot.company.logoUrl,
                },
              } as BillingSettings
            }
            pdfShareUrl={shareUrl}
          />
        </div>
      </div>
    );
  }

  // PDF-only share (legacy)
  if (share.pdfBase64) {
    const blobUrl = URL.createObjectURL(base64ToPdfBlob(share.pdfBase64));
    return (
      <div className="flex min-h-dvh flex-col bg-default-100">
        <div className="flex items-center justify-between gap-3 border-b border-default-200 bg-content1 px-4 py-3">
          <p className="truncate text-sm font-bold" dir="ltr">
            {share.invoiceNumber}.pdf
          </p>
          <Button as="a" href={blobUrl} download={`${share.invoiceNumber}.pdf`} color="primary" size="sm">
            {t("invoices.public.download_pdf")}
          </Button>
        </div>
        <iframe title="invoice" src={blobUrl} className="min-h-0 w-full flex-1 border-0" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
