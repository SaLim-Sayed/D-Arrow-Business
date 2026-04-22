import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
  };

  const label = i18n.language === "ar" ? t("language.en") : t("language.ar");

  return (
    <Button variant="tertiary" size="sm" onPress={toggleLanguage}>
      <Languages className="h-4 w-4 me-1" />
      {label}
    </Button>
  );
}
