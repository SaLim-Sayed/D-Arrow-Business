import { useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Info,
  Scale,
  Users,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "billing-reports-guide-dismissed";

type ReportTab = "pl" | "bs" | "tb" | "ar" | "ap";

interface ReportsGuideProps {
  activeTab?: ReportTab;
  className?: string;
}

const TAB_KEYS: ReportTab[] = ["pl", "bs", "tb", "ar", "ap"];

const TAB_ICONS: Record<ReportTab, React.ElementType> = {
  pl: BarChart3,
  bs: Scale,
  tb: ArrowLeftRight,
  ar: Users,
  ap: Users,
};

export function ReportsGuide({ activeTab = "pl", className }: ReportsGuideProps) {
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
      <div className="flex items-start justify-between gap-3 border-b border-default-200 bg-default-50/80 px-4 py-3 dark:bg-default-50/5">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-default-800">
              {t("reports.guide.title")}
            </p>
            <p className="mt-0.5 text-xs text-default-500">
              {t("reports.guide.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-default-400 transition-colors hover:bg-default-100 hover:text-default-600"
          aria-label={t("reports.guide.dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAB_KEYS.map((key) => {
          const Icon = TAB_ICONS[key];
          const active = key === activeTab;
          return (
            <div
              key={key}
              className={cn(
                "rounded-lg border p-3 text-sm transition-colors",
                active
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-default-200 bg-default-50/40 dark:bg-default-50/5"
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-default-400"
                  )}
                />
                <span
                  className={cn(
                    "font-semibold",
                    active ? "text-primary" : "text-default-700"
                  )}
                >
                  {t(`reports.${key === "pl" ? "profit_loss" : key === "bs" ? "balance_sheet" : key === "tb" ? "trial_balance" : key === "ar" ? "aged_receivables" : "aged_payables"}`)}
                </span>
                {active && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {t("reports.guide.current_tab")}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-default-500">
                {t(`reports.guide.${key}`)}
              </p>
            </div>
          );
        })}
      </div>

      {activeTab === "pl" && (
        <div className="border-t border-default-200 bg-default-50/50 px-4 py-3 text-xs text-default-600 dark:bg-default-50/5">
          <span className="font-semibold text-default-800">
            {t("reports.guide.formula_label")}:{" "}
          </span>
          {t("reports.guide.formula_pl")}
        </div>
      )}
    </div>
  );
}
