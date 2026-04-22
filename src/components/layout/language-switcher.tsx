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
    <Button 
      variant="flat" 
      size="sm" 
      onPress={toggleLanguage}
      className="bg-default-100/50 hover:bg-default-200/50 font-bold text-xs rounded-xl"
    >
      <Languages className="h-4 w-4 me-2 text-primary" />
      {label}
    </Button>
  );
}
