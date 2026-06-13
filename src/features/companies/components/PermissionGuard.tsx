import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@heroui/react";
import { ShieldAlert } from "lucide-react";
import { useAppPermissions } from "../hooks/use-app-permissions";
import type { Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallbackMessageKey?: string;
}

export function PermissionGuard({
  permission,
  children,
  fallbackMessageKey = "permissions.denied",
}: PermissionGuardProps) {
  const { t } = useTranslation("settings");
  const { can, canAny } = useAppPermissions();
  const allowed = Array.isArray(permission)
    ? canAny(permission)
    : can(permission);

  if (!allowed) {
    return (
      <Card className="max-w-lg mx-auto mt-12 border border-danger/20">
        <CardBody className="p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-danger mx-auto" />
          <h2 className="font-bold text-lg">{t("permissions.deniedTitle")}</h2>
          <p className="text-sm text-default-500">{t(fallbackMessageKey)}</p>
        </CardBody>
      </Card>
    );
  }

  return <>{children}</>;
}
