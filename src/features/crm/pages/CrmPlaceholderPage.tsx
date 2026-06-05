import { useTranslation } from "react-i18next";
import { Card, CardBody, Chip } from "@heroui/react";
import { Construction } from "lucide-react";

interface CrmPlaceholderPageProps {
  titleKey: string;
  descriptionKey: string;
  phase?: string;
}

export function CrmPlaceholderPage({
  titleKey,
  descriptionKey,
  phase = "Phase 2",
}: CrmPlaceholderPageProps) {
  const { t } = useTranslation("crm");

  return (
    <Card className="border border-default-200/60 shadow-sm">
      <CardBody className="py-16 flex flex-col items-center text-center gap-4">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
          <Construction className="w-10 h-10" />
        </div>
        <Chip size="sm" variant="flat" color="warning" className="font-bold">
          {phase}
        </Chip>
        <h1 className="text-2xl font-black tracking-tight">{t(titleKey)}</h1>
        <p className="text-default-500 max-w-md text-sm">{t(descriptionKey)}</p>
      </CardBody>
    </Card>
  );
}
