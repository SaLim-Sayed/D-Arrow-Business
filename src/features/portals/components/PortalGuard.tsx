import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@heroui/react";
import { ShieldAlert } from "lucide-react";
import type { PortalId } from "@/lib/portal-permissions";
import { useCanAccessPortal } from "../hooks/use-portals";

const PORTAL_I18N: Record<PortalId, string> = {
  tasks: "portals.tasks.denied",
  crm: "portals.crm.denied",
  people: "portals.people.denied",
};

export function PortalGuard({
  portal,
  children,
}: {
  portal: PortalId;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const allowed = useCanAccessPortal(portal);

  if (!allowed) {
    return (
      <Card className="max-w-lg mx-auto mt-12 border border-danger/20">
        <CardBody className="p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-danger mx-auto" />
          <h2 className="font-bold text-lg">{t("portals.deniedTitle")}</h2>
          <p className="text-sm text-default-500">{t(PORTAL_I18N[portal])}</p>
        </CardBody>
      </Card>
    );
  }

  return <>{children}</>;
}
