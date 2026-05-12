import { Button } from "@heroui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  backAction?: React.ReactNode;
}

export function PageHeader({ title, description, actions, onBack, backAction }: PageHeaderProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {backAction}
          {!backAction && onBack && (
            <Button
              isIconOnly
              variant="light"
              onPress={onBack}
              className="rounded-full"
              size="sm"
            >
              <BackIcon className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-gradient leading-tight">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
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
