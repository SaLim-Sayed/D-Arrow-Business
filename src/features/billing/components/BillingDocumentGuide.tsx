import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CircleDollarSign,
  Info,
  UserRound,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "billing-document-guide-dismissed";

type DocumentVariant = "invoice" | "bill";

interface BillingDocumentGuideProps {
  variant: DocumentVariant;
  className?: string;
}

function GuideColumn({
  active,
  title,
  badge,
  rows,
}: {
  active: boolean;
  title: string;
  badge?: string;
  rows: { icon: React.ElementType; label: string; value: string }[];
}) {
  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col gap-3 rounded-lg border p-4 transition-colors",
        active
          ? "border-primary/40 bg-primary/[0.06] shadow-sm"
          : "border-default-200 bg-default-50/50 dark:bg-default-50/5"
      )}
    >
      {active && badge && (
        <span className="absolute -top-2.5 start-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          {badge}
        </span>
      )}
      <h3
        className={cn(
          "text-sm font-bold",
          active ? "text-primary" : "text-default-700"
        )}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-2 text-sm">
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                active ? "text-primary" : "text-default-400"
              )}
            />
            <div className="min-w-0">
              <span className="text-default-500">{label}: </span>
              <span className="font-medium text-default-800">{value}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BillingDocumentGuide({
  variant,
  className,
}: BillingDocumentGuideProps) {
  const { t } = useTranslation("billing");
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const invoiceRows = [
    {
      icon: UserRound,
      label: t("document_guide.party"),
      value: t("document_guide.customer"),
    },
    {
      icon: CircleDollarSign,
      label: t("document_guide.money_flow"),
      value: t("document_guide.money_in"),
    },
    {
      icon: ArrowLeftRight,
      label: t("document_guide.accounting"),
      value: t("document_guide.ar"),
    },
    {
      icon: Info,
      label: t("document_guide.example"),
      value: t("document_guide.example_invoice"),
    },
  ];

  const billRows = [
    {
      icon: Building2,
      label: t("document_guide.party"),
      value: t("document_guide.vendor"),
    },
    {
      icon: CircleDollarSign,
      label: t("document_guide.money_flow"),
      value: t("document_guide.money_out"),
    },
    {
      icon: ArrowLeftRight,
      label: t("document_guide.accounting"),
      value: t("document_guide.ap"),
    },
    {
      icon: Info,
      label: t("document_guide.example"),
      value: t("document_guide.example_bill"),
    },
  ];

  const otherLink =
    variant === "invoice"
      ? { to: "/billing/bills", label: t("document_guide.go_to_bills") }
      : { to: "/billing/invoices", label: t("document_guide.go_to_invoices") };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-default-200 bg-content1 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-default-200 bg-default-50/80 px-4 py-3 dark:bg-default-50/5">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-default-800">
              {t("document_guide.title")}
            </p>
            <p className="mt-0.5 text-xs text-default-500">
              {t("document_guide.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-default-400 transition-colors hover:bg-default-100 hover:text-default-600"
          aria-label={t("document_guide.dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4 lg:flex-row">
        <GuideColumn
          active={variant === "invoice"}
          title={t("document_guide.invoices_title")}
          badge={variant === "invoice" ? t("document_guide.current_page") : undefined}
          rows={invoiceRows}
        />
        <GuideColumn
          active={variant === "bill"}
          title={t("document_guide.bills_title")}
          badge={variant === "bill" ? t("document_guide.current_page") : undefined}
          rows={billRows}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default-200 px-4 py-2.5">
        <p className="text-xs text-default-500">
          <span className="font-mono font-semibold text-default-700" dir="ltr">
            INV-
          </span>
          {" · "}
          {t("document_guide.invoices_title")}
          {" · "}
          <span className="font-mono font-semibold text-default-700" dir="ltr">
            BILL-
          </span>
          {" · "}
          {t("document_guide.bills_title")}
        </p>
        <Link
          to={otherLink.to}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {otherLink.label}
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
