import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, Skeleton } from "@heroui/react";
import { Plus, FileText } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { MoneyAmount } from "@/components/shared/riyal-symbol";
import type { SavedQuotation } from "../types/quotation.types";

interface QuotationSavedMenuProps {
  quotations: SavedQuotation[];
  activeId: string | null;
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function QuotationSavedMenu({
  quotations,
  activeId,
  isLoading,
  onSelect,
  onNew,
}: QuotationSavedMenuProps) {
  const { t, i18n } = useTranslation("crm");
  const priceDirection = i18n.language.startsWith("ar") ? "rtl" : "ltr";

  return (
    <Card className="border border-default-100 lg:sticky lg:top-4">
      <CardBody className="gap-3 p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-bold truncate">{t("quotation.recentQuotes")}</p>
          </div>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="rounded-full shrink-0"
            startContent={<Plus className="h-3.5 w-3.5" />}
            onPress={onNew}
          >
            {t("quotation.newQuote")}
          </Button>
        </div>

        <div className="max-h-[min(420px,50vh)] overflow-y-auto space-y-1 pr-0.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          ) : quotations.length === 0 ? (
            <p className="text-xs text-default-400 px-2 py-6 text-center">
              {t("quotation.noSavedQuotes")}
            </p>
          ) : (
            quotations.map((q) => {
              const isActive = activeId === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelect(q.id)}
                  className={cn(
                    "w-full text-start rounded-xl px-3 py-2.5 transition-colors border",
                    isActive
                      ? "bg-primary/10 border-primary/25 shadow-sm"
                      : "border-transparent hover:bg-default-100"
                  )}
                >
                  <p className="text-sm font-semibold line-clamp-2 leading-snug">
                    {q.title}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="text-[11px] text-default-400">
                      {formatDate(q.updatedAt)}
                    </span>
                    {q.total > 0 ? (
                      <MoneyAmount
                        amount={q.total}
                        currency={q.currency}
                        symbolSize={10}
                        className="text-xs"
                        priceDirection={priceDirection}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}
