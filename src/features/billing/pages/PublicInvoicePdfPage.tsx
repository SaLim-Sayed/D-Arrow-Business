import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Spinner } from "@heroui/react";
import { getInvoicePublicShare } from "../api/invoice-share.service";

/**
 * Public landing for invoice QR scans.
 * Camera opens https://…/i/:token → redirect to the hosted PDF.
 */
export default function PublicInvoicePdfPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation("billing");
  const [error, setError] = useState<"missing" | "not_ready" | "failed" | null>(
    null
  );

  useEffect(() => {
    if (!token?.trim()) {
      setError("missing");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      try {
        const share = await getInvoicePublicShare(token.trim());
        if (cancelled) return;
        if (share?.pdfUrl) {
          window.location.replace(share.pdfUrl);
          return;
        }
        attempts += 1;
        if (attempts < 8) {
          window.setTimeout(load, 700);
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
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
          {t("invoices.public.go_login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-default-50">
      <Spinner size="lg" color="primary" />
      <p className="text-sm text-default-500">{t("invoices.public.opening_pdf")}</p>
    </div>
  );
}
