import { useTranslation } from "react-i18next";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Chip,
  User,
  Card,
  CardBody,
} from "@heroui/react";
import { PermissionGuard } from "../components/PermissionGuard";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useUpdateUserRoleMutation } from "@/features/users/hooks/use-user-role-mutation";
import { useAppPermissions } from "../hooks/use-app-permissions";
import { useAuthStore } from "@/stores/auth.store";
import { selectFieldProps } from "@/components/shared/select-field";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  getAssignableRoles,
  canManageUserRole,
} from "@/lib/permissions/role-assignment";
import { PortalAccessEditor } from "../components/PortalAccessEditor";
import { canManagePortalAccess } from "@/lib/permissions/portal-access";
import type { UserRole } from "@/features/auth/types/auth.types";

const ROLE_COLORS: Record<UserRole, "primary" | "secondary" | "success" | "warning" | "default"> = {
  super_admin: "primary",
  admin: "secondary",
  manager: "success",
  employee: "default",
  viewer: "warning",
};

export function TeamMembersPage() {
  const { t, i18n } = useTranslation("settings");
  const { data: users = [], isLoading } = useAllUsers();
  const updateRole = useUpdateUserRoleMutation();
  const { role: actorRole } = useAppPermissions();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const assignableRoles = getAssignableRoles(actorRole);
  const canEditPortals = canManagePortalAccess(actorRole);

  const roleLabel = (role: UserRole) => t(`team.globalRoles.${role}`);

  return (
    <PermissionGuard permission="users.manage_roles">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-black">{t("team.pageTitle")}</h1>
          <p className="text-sm text-default-500">{t("team.pageSubtitle")}</p>
        </div>

        <Card className="border border-default-100">
          <CardBody className="p-0">
            {isLoading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : users.length === 0 ? (
              <p className="p-8 text-sm text-default-500 text-center">
                {t("team.empty")}
              </p>
            ) : (
              <Table aria-label={t("team.pageTitle")} removeWrapper>
                <TableHeader>
                  <TableColumn>{t("team.member")}</TableColumn>
                  <TableColumn>{t("team.email")}</TableColumn>
                  <TableColumn>{t("team.currentRole")}</TableColumn>
                  <TableColumn>{t("team.assignRole")}</TableColumn>
                  <TableColumn>{t("team.portalAccess")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {users.map((member) => {
                    const canEdit = canManageUserRole(
                      actorRole,
                      currentUserId ?? "",
                      member.id
                    );
                    const isSelf = member.id === currentUserId;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <User
                            name={member.nameAr && i18n.language === "ar" ? member.nameAr : member.name}
                            description={isSelf ? t("team.you") : undefined}
                            avatarProps={{
                              src: member.avatar,
                              name: member.name,
                              size: "sm",
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-default-600">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={ROLE_COLORS[member.role]}
                          >
                            {roleLabel(member.role)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Select
                              {...selectFieldProps({ compact: true })}
                              size="sm"
                              variant="bordered"
                              aria-label={t("team.assignRole")}
                              selectedKeys={new Set([member.role])}
                              isLoading={
                                updateRole.isPending &&
                                updateRole.variables?.targetUserId === member.id
                              }
                              className="min-w-[160px]"
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as UserRole;
                                if (selected && selected !== member.role) {
                                  updateRole.mutate({
                                    targetUserId: member.id,
                                    newRole: selected,
                                  });
                                }
                              }}
                            >
                              {assignableRoles.map((r) => (
                                <SelectItem key={r} textValue={roleLabel(r)}>{roleLabel(r)}</SelectItem>
                              ))}
                            </Select>
                          ) : (
                            <span className="text-xs text-default-400">
                              {t("team.cannotEdit")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEditPortals ? (
                            <PortalAccessEditor member={member} />
                          ) : (
                            <span className="text-xs text-default-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </PermissionGuard>
  );
}
