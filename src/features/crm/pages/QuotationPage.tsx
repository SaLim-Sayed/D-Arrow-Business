import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { QuotationBuilderForm } from "../components/QuotationBuilderForm";

export function QuotationPage() {
  const { t } = useTranslation("crm");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("quotation.pageTitle")}
        description={t("quotation.pageSubtitle")}
      />
      <QuotationBuilderForm />
    </div>
  );
}
