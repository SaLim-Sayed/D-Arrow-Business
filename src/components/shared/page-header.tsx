import { Button } from "@heroui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  backAction?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  onBack,
  backAction,
  className,
}: PageHeaderProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className={cn("flex flex-col gap-2 mb-6 sm:mb-8", className)}>
      {eyebrow && (
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-70">
          {eyebrow}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backAction}
          {!backAction && onBack && (
            <Button
              isIconOnly
              variant="light"
              onPress={onBack}
              className="rounded-full shrink-0"
              size="sm"
            >
              <BackIcon className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-gradient leading-tight truncate">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm font-medium text-default-500 max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
