import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@heroui/react";
import { Download, Printer } from "lucide-react";
import i18n from "@/lib/i18n";
import {
  base64ToPdfBlob,
  getInvoicePublicShare,
  hydrateInvoiceFromSnapshot,
  invoicePdfShareUrl,
  type InvoicePublicShare,
} from "../api/invoice-share.service";
import { InvoicePrintDocument } from "../components/InvoicePrintDocument";
import { generateQuotationPdf } from "@/features/crm/utils/generate-quotation-pdf";
import type { BillingSettings } from "../schemas/settings";

/**
 * Public (no sign-in) invoice page for QR scans.
 * Renders the same A4 InvoicePrintDocument as the signed-in detail page.
 */
export default function PublicInvoicePdfPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation("billing");
  const printRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [share, setShare] = useState<InvoicePublicShare | null>(null);
  const [error, setError] = useState<"missing" | "not_ready" | "failed" | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>();

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

  // Match invoice language/dir to how it was published (same layout as in-app)
  useEffect(() => {
    if (!share?.snapshot) return;
    const locale = share.snapshot.locale || "ar";
    const next = locale.startsWith("ar") ? "ar" : "en";
    const prev = i18n.language;
    void i18n.changeLanguage(next);
    return () => {
      void i18n.changeLanguage(prev);
    };
  }, [share?.snapshot]);

  const hydrated = useMemo(() => {
    if (!share?.snapshot) return null;
    return hydrateInvoiceFromSnapshot(share.snapshot);
  }, [share]);

  // Keep A4 proportions on phone — scale down to fit viewport width
  useLayoutEffect(() => {
    if (!share?.snapshot || !hydrated) return;

    const updateScale = () => {
      const page = pageRef.current;
      if (!page?.parentElement) return;
      const available = page.parentElement.clientWidth;
      const natural = 210 * (96 / 25.4); // 210mm ≈ CSS px
      const next = Math.min(1, available / natural);
      setScale(next);
      setScaledHeight(next < 1 ? page.offsetHeight * next : undefined);
    };

    const raf = window.requestAnimationFrame(updateScale);
    window.addEventListener("resize", updateScale);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateScale);
    };
  }, [share?.snapshot, hydrated]);

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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
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

  if (!share || (share.snapshot && !hydrated)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" color="primary" />
        <p className="text-sm text-default-500">{t("invoices.public.opening_pdf")}</p>
        <p className="text-xs text-default-400">
          {t("invoices.public.no_signin_needed")}
        </p>
      </div>
    );
  }

  // Primary path: same InvoicePrintDocument A4 sheet as InvoiceDetailPage
  if (share.snapshot && hydrated) {
    const shareUrl = token ? invoicePdfShareUrl(token) : undefined;

    return (
      <div className="min-h-dvh bg-background px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-[220mm] space-y-6 pb-20 animate-in fade-in duration-500">
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-default-100 bg-background/80 py-4 backdrop-blur-md print:hidden">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold" dir="ltr">
                {share.invoiceNumber}
              </h1>
              <p className="text-sm text-default-500">
                {t("invoices.public.no_signin_needed")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="flat"
                isIconOnly
                aria-label={t("actions.download_pdf")}
                isLoading={exporting}
                onPress={() => void handleDownloadPdf()}
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
            className="overflow-x-hidden print:h-auto print:overflow-visible"
            style={{ height: scaledHeight }}
          >
            <div
              ref={pageRef}
              className="print:!transform-none"
              style={{
                transform: scale < 1 ? `scale(${scale})` : undefined,
                transformOrigin: "top center",
                width: "100%",
              }}
            >
              <div
                ref={printRef}
                className="overflow-x-auto rounded-lg border border-default-200 bg-default-50/50 p-2 shadow-sm print:border-none print:bg-white print:p-0 print:shadow-none print:transform-none"
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
          </div>
        </div>
      </div>
    );
  }

  // Fallback: hosted PDF / embedded bytes (legacy shares without snapshot)
  if (share.pdfUrl?.startsWith("http")) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="flex items-center justify-between gap-3 border-b border-default-100 px-4 py-3">
          <p className="truncate text-sm font-bold" dir="ltr">
            {share.invoiceNumber}.pdf
          </p>
          <Button
            as="a"
            href={share.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            size="sm"
          >
            {t("invoices.public.download_pdf")}
          </Button>
        </div>
        <iframe
          title="invoice"
          src={share.pdfUrl}
          className="min-h-0 w-full flex-1 border-0"
        />
      </div>
    );
  }

  if (share.pdfBase64) {
    const blobUrl = URL.createObjectURL(base64ToPdfBlob(share.pdfBase64));
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="flex items-center justify-between gap-3 border-b border-default-100 px-4 py-3">
          <p className="truncate text-sm font-bold" dir="ltr">
            {share.invoiceNumber}.pdf
          </p>
          <Button
            as="a"
            href={blobUrl}
            download={`${share.invoiceNumber}.pdf`}
            color="primary"
            size="sm"
          >
            {t("invoices.public.download_pdf")}
          </Button>
        </div>
        <iframe
          title="invoice"
          src={blobUrl}
          className="min-h-0 w-full flex-1 border-0"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
