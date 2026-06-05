import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  compact = false,
  className,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
  };

  const label = i18n.language === "ar" ? t("language.en") : t("language.ar");

  if (compact) {
    return (
      <Button
        isIconOnly
        variant="flat"
        size="sm"
        onPress={toggleLanguage}
        aria-label={`${t("language.en")} / ${t("language.ar")}`}
        title={label}
        className={cn(
          "bg-default-100/50 hover:bg-default-200/50 min-w-9 h-9",
          className
        )}
      >
        <Languages className="h-4 w-4 text-primary" />
      </Button>
    );
  }

  return (
    <Button
      variant="flat"
      size="sm"
      onPress={toggleLanguage}
      aria-label={label}
      className={cn(
        "bg-default-100/50 hover:bg-default-200/50 font-bold text-xs rounded-xl",
        className
      )}
    >
      <Languages className="h-4 w-4 me-2 text-primary" />
      {label}
    </Button>
  );
}

export function LanguageSwitcherRow({ onToggle }: { onToggle?: () => void }) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    onToggle?.();
  };

  const label = i18n.language === "ar" ? t("language.en") : t("language.ar");
  const current =
    i18n.language === "ar" ? t("language.ar") : t("language.en");

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-default-100 transition-colors"
    >
      <Languages className="h-5 w-5 text-primary" />
      <span className="flex-1 text-start">{current}</span>
      <span className="text-xs font-bold text-primary">{label}</span>
    </button>
  );
}
