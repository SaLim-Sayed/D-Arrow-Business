import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

function applyDocumentDirection(lng: string | undefined) {
  const language = lng || i18n.language || "en";
  const dir = language.toLowerCase().startsWith("ar") ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    ns: ["common", "auth", "tasks", "profile", "people", "crm", "settings", "landing", "chat", "billing", "meetings"],
    defaultNS: "common",
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "d-arrow-lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// languageChanged does not run on first load — set dir immediately too.
applyDocumentDirection(i18n.language);
i18n.on("initialized", () => applyDocumentDirection(i18n.language));
i18n.on("languageChanged", applyDocumentDirection);

export default i18n;
