import type { UserRole } from "@/features/auth/types/auth.types";
import type { Permission } from "./index";
import { hasPermission, ROLE_PERMISSIONS } from "./index";
import {
  getSubRolePermissions,
  permissionPortal,
  resolvePortalSubRole,
  type PortalSubRoles,
} from "./sub-roles";

export interface PermissionContext {
  role: UserRole | undefined;
  portalSubRoles?: PortalSubRoles | null;
}

export function hasEffectivePermission(
  ctx: PermissionContext,
  permission: Permission
): boolean {
  const { role, portalSubRoles } = ctx;
  if (!role) return false;

  if (role === "super_admin") {
    return ROLE_PERMISSIONS.super_admin.includes(permission);
  }

  const portal = permissionPortal(permission);
  if (portal) {
    const subRole = resolvePortalSubRole(portal, role, portalSubRoles);
    if (subRole) {
      const subAllowed = getSubRolePermissions(portal, subRole).includes(permission);
      if (!subAllowed) return false;
    }
  }

  return hasPermission(role, permission);
}

export function hasAnyEffectivePermission(
  ctx: PermissionContext,
  permissions: readonly Permission[]
): boolean {
  return permissions.some((p) => hasEffectivePermission(ctx, p));
}
