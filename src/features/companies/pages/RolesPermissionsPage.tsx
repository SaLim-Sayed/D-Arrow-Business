import { useTranslation } from "react-i18next";
import { Card, CardBody, Chip } from "@heroui/react";
import { PermissionGuard } from "../components/PermissionGuard";
import {
  ROLE_PERMISSIONS,
  type Permission,
} from "@/lib/permissions";
import type { UserRole } from "@/features/auth/types/auth.types";

const ROLE_ORDER: UserRole[] = [
  "super_admin",
  "admin",
  "manager",
  "employee",
  "viewer",
];

const PERMISSION_GROUPS: { titleKey: string; keys: Permission[] }[] = [
  {
    titleKey: "roles.groups.portals",
    keys: [
      "portals.tasks",
      "portals.crm",
      "portals.people",
      "portals.billing",
      "portals.chat",
    ],
  },
  {
    titleKey: "roles.groups.company",
    keys: ["company.view", "company.manage", "pricing.view", "pricing.manage"],
  },
  {
    titleKey: "roles.groups.people",
    keys: [
      "people.view",
      "people.manage_employees",
      "people.approve_leave",
      "people.view_performance",
    ],
  },
  {
    titleKey: "roles.groups.crm",
    keys: [
      "crm.view",
      "crm.manage_leads",
      "crm.manage_contacts",
      "crm.manage_deals",
      "crm.manage_tasks",
      "crm.delete",
    ],
  },
  {
    titleKey: "roles.groups.tasks",
    keys: [
      "tasks.view",
      "tasks.create",
      "tasks.edit",
      "tasks.delete",
      "tasks.approve",
    ],
  },
  {
    titleKey: "roles.groups.admin",
    keys: ["users.manage_roles", "admin.seed"],
  },
];

export function RolesPermissionsPage() {
  const { t } = useTranslation("settings");

  return (
    <PermissionGuard permission="users.manage_roles">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-black">{t("roles.pageTitle")}</h1>
          <p className="text-sm text-default-500">{t("roles.pageSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {ROLE_ORDER.map((role) => (
            <Card key={role} className="border border-default-100">
              <CardBody className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{t(`team.globalRoles.${role}`)}</h3>
                  <Chip size="sm" variant="flat" color="primary">
                    {ROLE_PERMISSIONS[role].length} {t("roles.permissionsCount")}
                  </Chip>
                </div>
                {PERMISSION_GROUPS.map((group) => {
                  const groupPerms = group.keys.filter((p) =>
                    ROLE_PERMISSIONS[role].includes(p)
                  );
                  if (!groupPerms.length) return null;
                  return (
                    <div key={group.titleKey}>
                      <p className="text-[10px] font-black uppercase tracking-wider text-default-400 mb-2">
                        {t(group.titleKey)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groupPerms.map((perm) => (
                          <Chip key={perm} size="sm" variant="bordered" className="text-[10px]">
                            {t(`roles.permissions.${perm}`, perm)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}
