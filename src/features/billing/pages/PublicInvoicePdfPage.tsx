import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

/** A4 width in CSS pixels (96dpi). */
const A4_WIDTH_PX = (210 * 96) / 25.4;

const SUPPORTS_ZOOM =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("zoom", "0.5");

/**
 * Public (no sign-in) invoice page for QR scans.
 * Mobile: scale full A4 sheet to phone width without RTL shift bugs.
 */
export default function PublicInvoicePdfPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation("billing");
  const printRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [share, setShare] = useState<InvoicePublicShare | null>(null);
  const [error, setError] = useState<"missing" | "not_ready" | "failed" | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(0);

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
    const viewport = viewportRef.current;
    const sheet = sheetRef.current;
    if (!viewport || !sheet) return;

    const available = Math.max(0, viewport.clientWidth);
    const next = available > 0 ? Math.min(1, available / A4_WIDTH_PX) : 1;
    setScale(next);
    // offsetHeight is pre-zoom/pre-transform natural height
    setSheetHeight(sheet.scrollHeight || sheet.offsetHeight);
  };

  useLayoutEffect(() => {
    if (!share?.snapshot || !hydrated) return;

    const run = () => {
      // Wait a frame so fonts / QR paint, then measure
      window.requestAnimationFrame(updateScale);
    };
    run();
    const t = window.setTimeout(run, 200);

    const viewport = viewportRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && viewport
        ? new ResizeObserver(() => updateScale())
        : null;
    observer?.observe(viewport!);
    window.addEventListener("resize", updateScale);

    return () => {
      window.clearTimeout(t);
      observer?.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [share?.snapshot, hydrated]);

  const handleDownloadPdf = async () => {
    if (!share || !printRef.current) return;
    setExporting(true);
    try {
      await generateInvoicePdf(
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

  // zoom adjusts layout size; transform needs an explicit clip height
  const clipHeight =
    !SUPPORTS_ZOOM && sheetHeight > 0 ? sheetHeight * scale : undefined;

  const sheetStyle: CSSProperties = SUPPORTS_ZOOM
    ? ({
        width: A4_WIDTH_PX,
        zoom: scale,
      } as CSSProperties)
    : {
        width: A4_WIDTH_PX,
        transform: scale < 1 ? `scale(${scale})` : undefined,
        transformOrigin: "0 0",
      };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-[220mm] px-2 pb-16 pt-3 sm:px-4">
        <div
          className="sticky top-0 z-20 mb-3 flex items-center justify-between gap-3 border-b border-default-100 bg-background/90 py-3 backdrop-blur-md print:hidden"
          dir="rtl"
        >
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold" dir="ltr">
              {share.invoiceNumber}
            </h1>
            <p className="text-sm text-default-500">
              {t("invoices.public.no_signin_needed")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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

        {/*
          dir=ltr on the viewport is required: under page-level RTL, a 210mm
          sheet overflows to the left and transform/zoom clips to a blank box.
          InvoicePrintDocument keeps its own dir=rtl for Arabic content.
        */}
        <div
          ref={viewportRef}
          dir="ltr"
          className="w-full overflow-x-hidden print:overflow-visible"
          style={{ height: clipHeight }}
        >
          <div
            ref={sheetRef}
            data-public-invoice-sheet
            className="rounded-lg border border-default-200 bg-white shadow-sm print:rounded-none print:border-none print:shadow-none"
            style={sheetStyle}
          >
            <div ref={printRef} className="bg-white">
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

      <style>{`
        @media print {
          [data-public-invoice-sheet] {
            zoom: 1 !important;
            transform: none !important;
            width: 210mm !important;
          }
        }
      `}</style>
    </div>
  );
}
