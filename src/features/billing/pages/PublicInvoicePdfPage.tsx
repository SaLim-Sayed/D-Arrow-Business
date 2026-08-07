import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@heroui/react";
import { Download, Printer } from "lucide-react";
import i18n from "@/lib/i18n";
import {
  getInvoicePublicShare,
  hydrateInvoiceFromSnapshot,
  invoicePdfShareUrl,
  type InvoicePublicShare,
} from "../api/invoice-share.service";
import { InvoicePrintDocument } from "../components/InvoicePrintDocument";
import { generateInvoicePdf } from "../utils/generate-invoice-pdf";
import type { BillingSettings } from "../schemas/settings";

/**
 * Public (no sign-in) invoice page for QR scans.
 * Always shows + downloads the same A4 InvoicePrintDocument as the app.
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

        // Prefer snapshot so scan always shows the same invoice layout as the app
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

  // Public tax invoices always show in Arabic
  useEffect(() => {
    if (!share?.snapshot) return;
    const prev = i18n.language;
    void i18n.changeLanguage("ar");
    return () => {
      void i18n.changeLanguage(prev);
    };
  }, [share?.snapshot]);

  const hydrated = useMemo(() => {
    if (!share?.snapshot) return null;
    return hydrateInvoiceFromSnapshot(share.snapshot);
  }, [share]);

  const updateScale = () => {
    const page = pageRef.current;
    if (!page?.parentElement) return;
    const available = page.parentElement.clientWidth;
    const natural = 210 * (96 / 25.4);
    const next = Math.min(1, available / natural);
    setScale(next);
    setScaledHeight(next < 1 ? page.offsetHeight * next : undefined);
  };

  useLayoutEffect(() => {
    if (!share?.snapshot || !hydrated) return;
    const raf = window.requestAnimationFrame(updateScale);
    window.addEventListener("resize", updateScale);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateScale);
    };
  }, [share?.snapshot, hydrated]);

  /** Download PDF always in Arabic (same layout as scanned view). */
  const handleDownloadPdf = async () => {
    if (!share || !printRef.current) return;
    setExporting(true);

    const page = pageRef.current;
    const prevTransform = page?.style.transform ?? "";
    if (page) page.style.transform = "none";
    setScaledHeight(undefined);

    try {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      await generateInvoicePdf(
        printRef.current,
        `${share.invoiceNumber || "invoice"}.pdf`
      );
    } finally {
      if (page) page.style.transform = prevTransform;
      updateScale();
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

  if (!share) {
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

  // Snapshot missing: cannot render same layout — ask user to reopen invoice in app
  if (!share.snapshot || !hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-base font-bold text-default-800">
          {t("invoices.public.pdf_not_ready")}
        </p>
        <p className="max-w-sm text-sm text-default-500">
          {t("invoices.public.pdf_unavailable_hint")}
        </p>
      </div>
    );
  }

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
              className="overflow-x-auto rounded-lg border border-default-200 bg-default-50/50 p-2 shadow-sm print:border-none print:bg-white print:p-0 print:shadow-none"
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
