import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@heroui/react";
import { PageHeader } from "@/components/shared/page-header";
import { ShieldAlert } from "lucide-react";
import { ContractBuilderForm } from "../components/ContractBuilderForm";
import { useCrmPermissions } from "../hooks/use-crm-permissions";

export function ContractPage() {
  const { t } = useTranslation("crm");
  const { canManageContracts } = useCrmPermissions();

  if (!canManageContracts) {
    return (
      <Card className="max-w-lg mx-auto mt-12 border border-danger/20">
        <CardBody className="p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-danger mx-auto" />
          <h2 className="font-bold text-lg">{t("permissions.deniedTitle")}</h2>
          <p className="text-sm text-default-500">{t("permissions.deniedMessage")}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      <PageHeader
        eyebrow="CRM"
        title={t("contract.pageTitle")}
        description={t("contract.pageSubtitle")}
        className="mb-5"
      />
      <ContractBuilderForm />
    </div>
  );
}
