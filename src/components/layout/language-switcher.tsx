import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

function isArabic(lng: string | undefined) {
  return lng?.startsWith("ar") ?? false;
}

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  compact = false,
  className,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const arabic = isArabic(i18n.language);

  const toggleLanguage = () => {
    i18n.changeLanguage(arabic ? "en" : "ar");
  };

  const label = arabic ? t("language.en") : t("language.ar");
  const current = arabic ? t("language.ar") : t("language.en");

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
      title={current}
      className={cn(
        "bg-default-100/50 hover:bg-default-200/50 font-bold text-xs rounded-xl min-w-0",
        className
      )}
    >
      <Languages className="h-4 w-4 shrink-0 me-2 text-primary" />
      <span className="truncate">{label}</span>
    </Button>
  );
}

export function LanguageTogglePills({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const arabic = isArabic(i18n.language);

  const pillClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
      active
        ? "bg-background text-foreground shadow-sm"
        : "text-default-500 hover:text-foreground"
    );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-default-100/80 p-1",
        className
      )}
      role="group"
      aria-label={`${t("language.en")} / ${t("language.ar")}`}
    >
      <button
        type="button"
        className={pillClass(!arabic)}
        onClick={() => i18n.changeLanguage("en")}
        aria-pressed={!arabic}
      >
        {t("language.en")}
      </button>
      <button
        type="button"
        className={pillClass(arabic)}
        onClick={() => i18n.changeLanguage("ar")}
        aria-pressed={arabic}
      >
        {t("language.ar")}
      </button>
    </div>
  );
}

export function LanguageSwitcherRow({ onToggle }: { onToggle?: () => void }) {
  const { i18n, t } = useTranslation();
  const arabic = isArabic(i18n.language);

  const toggleLanguage = () => {
    i18n.changeLanguage(arabic ? "en" : "ar");
    onToggle?.();
  };

  const label = arabic ? t("language.en") : t("language.ar");
  const current = arabic ? t("language.ar") : t("language.en");

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
