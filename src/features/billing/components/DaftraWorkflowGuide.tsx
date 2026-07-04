import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  FileSpreadsheet,
  Info,
  ReceiptText,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "daftra-workflow-guide-dismissed";

function FlowStep({
  icon: Icon,
  title,
  steps,
  accentClass,
}: {
  icon: React.ElementType;
  title: string;
  steps: string[];
  accentClass: string;
}) {
  return (
    <div className="flex flex-1 flex-col rounded-lg border border-default-200 bg-default-50/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn("rounded-lg p-2", accentClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-default-800">{title}</h3>
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2 text-sm text-default-600">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-content1 text-xs font-bold text-default-500 shadow-sm">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DaftraWorkflowGuide({ className }: { className?: string }) {
  const { t } = useTranslation("billing");
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-default-200 bg-content1 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-default-200 bg-default-50/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-default-900">
              {t("daftra.guide.title")}
            </h3>
            <p className="text-xs text-default-500">{t("daftra.guide.subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-default-400 hover:bg-default-100 hover:text-default-600"
          aria-label={t("daftra.guide.dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 md:flex-row">
        <FlowStep
          icon={FileSpreadsheet}
          title={t("daftra.guide.sales_title")}
          steps={[
            t("daftra.guide.sales_step1"),
            t("daftra.guide.sales_step2"),
            t("daftra.guide.sales_step3"),
            t("daftra.guide.sales_step4"),
          ]}
          accentClass="bg-primary/10 text-primary"
        />
        <div className="hidden items-center justify-center md:flex">
          <ArrowLeftRight className="h-5 w-5 text-default-300 rtl:rotate-180" />
        </div>
        <FlowStep
          icon={ReceiptText}
          title={t("daftra.guide.purchase_title")}
          steps={[
            t("daftra.guide.purchase_step1"),
            t("daftra.guide.purchase_step2"),
            t("daftra.guide.purchase_step3"),
            t("daftra.guide.purchase_step4"),
          ]}
          accentClass="bg-danger/10 text-danger"
        />
      </div>

      <div className="border-t border-default-100 bg-primary/[0.03] px-4 py-3">
        <p className="text-xs text-default-600">
          {t("daftra.guide.footer")}{" "}
          <Link to="/billing/settings" className="font-semibold text-primary hover:underline">
            {t("daftra.guide.settings_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ZatcaComplianceBanner({
  taxNumber,
  className,
}: {
  taxNumber?: string;
  className?: string;
}) {
  const { t } = useTranslation("billing");
  const isConfigured = !!taxNumber && taxNumber.replace(/\D/g, "").length >= 10;

  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        isConfigured
          ? "border-success/30 bg-success/5"
          : "border-warning/30 bg-warning/5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold",
            isConfigured ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          )}
        >
          {isConfigured ? "✓" : "!"}
        </div>
        <div>
          <p className="text-sm font-bold text-default-900">
            {isConfigured ? t("daftra.zatca.enabled") : t("daftra.zatca.disabled")}
          </p>
          <p className="text-xs text-default-500">
            {isConfigured
              ? t("daftra.zatca.enabled_desc", { taxNumber })
              : t("daftra.zatca.disabled_desc")}
          </p>
        </div>
      </div>
      <Link
        to="/billing/settings"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        {isConfigured ? t("daftra.zatca.view_settings") : t("daftra.zatca.setup")}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </div>
  );
}
