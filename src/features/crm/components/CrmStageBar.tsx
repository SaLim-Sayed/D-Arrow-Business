import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

interface CrmStageBarProps<T extends string> {
  stages: readonly T[];
  current: T;
  onStageClick?: (stage: T) => void;
  labelKey: (stage: T) => string;
  disabled?: boolean;
  /** Stages that are terminal (won/lost) — shown muted after main pipeline */
  terminalStages?: T[];
}

export function CrmStageBar<T extends string>({
  stages,
  current,
  onStageClick,
  labelKey,
  disabled,
  terminalStages = [],
}: CrmStageBarProps<T>) {
  const { t } = useTranslation("crm");
  const mainStages = stages.filter((s) => !terminalStages.includes(s));
  const terminal = stages.filter((s) => terminalStages.includes(s));
  const currentIdx = mainStages.indexOf(current);
  const isTerminal = terminalStages.includes(current);

  const renderStage = (stage: T, idx: number, isLast: boolean) => {
    const isActive = stage === current;
    const isPast = !isTerminal && currentIdx > idx;
    const clickable = !disabled && onStageClick && !isActive;

    return (
      <div key={stage} className="flex items-center shrink-0">
        <button
          type="button"
          disabled={!clickable}
          onClick={() => clickable && onStageClick?.(stage)}
          className={cn(
            "px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all whitespace-nowrap",
            isActive && "bg-primary text-white shadow-md shadow-primary/25",
            isPast && !isActive && "bg-primary/15 text-primary",
            !isActive && !isPast && "bg-default-100 text-default-500",
            clickable && "hover:bg-primary/20 cursor-pointer",
            !clickable && "cursor-default"
          )}
        >
          {labelKey(stage)}
        </button>
        {!isLast && (
          <ChevronRight className="h-4 w-4 mx-0.5 text-default-300 shrink-0" aria-hidden />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-default-50 border border-default-100 overflow-x-auto scrollbar-hide">
      <span className="text-[10px] font-bold text-default-400 uppercase me-2 shrink-0">
        {t("ui.stageBar")}
      </span>
      {mainStages.map((s, i) => renderStage(s, i, i === mainStages.length - 1 && terminal.length === 0))}
      {terminal.length > 0 && (
        <>
          <span className="mx-1 text-default-300">|</span>
          {terminal.map((s, i) => renderStage(s, -1, i === terminal.length - 1))}
        </>
      )}
    </div>
  );
}
