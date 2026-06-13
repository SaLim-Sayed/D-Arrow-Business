import { useTranslation } from "react-i18next";
import { PermissionGuard } from "../components/PermissionGuard";
import { CompanyProfileForm } from "../components/CompanyProfileForm";

export function CompanySettingsPage() {
  const { t } = useTranslation("settings");

  return (
    <PermissionGuard permission="company.view">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-black">{t("company.pageTitle")}</h1>
          <p className="text-sm text-default-500">{t("company.pageSubtitle")}</p>
        </div>
        <CompanyProfileForm />
      </div>
    </PermissionGuard>
  );
}
