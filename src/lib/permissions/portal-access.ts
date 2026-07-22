import type { PortalId } from "@/lib/portal-permissions";
import type { UserRole } from "@/features/auth/types/auth.types";
import { getAccessiblePortals as getRolePortals } from "@/lib/permissions";

export const ALL_PORTAL_IDS: PortalId[] = [
  "tasks",
  "crm",
  "people",
  "billing",
  "chat",
];

export function getRoleDefaultPortals(role: UserRole | undefined): PortalId[] {
  return getRolePortals(role);
}

/** Effective portals for a user (role defaults or super-admin custom subset). */
export function resolveUserPortals(
  role: UserRole | undefined,
  portalAccess?: PortalId[] | null
): PortalId[] {
  const rolePortals = getRoleDefaultPortals(role);
  if (!portalAccess?.length) return rolePortals;

  const picked = portalAccess.filter((p) => ALL_PORTAL_IDS.includes(p));
  const restricted = picked.filter((p) => rolePortals.includes(p));
  return restricted.length ? restricted : rolePortals;
}

export function canUserAccessPortal(
  role: UserRole | undefined,
  portal: PortalId,
  portalAccess?: PortalId[] | null
): boolean {
  return resolveUserPortals(role, portalAccess).includes(portal);
}

export function canManagePortalAccess(actorRole: UserRole | undefined): boolean {
  return actorRole === "super_admin";
}

/** Portals a super admin may assign to a target user (within their role). */
export function getAssignablePortalsForUser(
  targetRole: UserRole
): PortalId[] {
  return getRoleDefaultPortals(targetRole);
}

export function normalizePortalAccessForSave(
  targetRole: UserRole,
  selected: PortalId[]
): PortalId[] | null {
  const allowed = getAssignablePortalsForUser(targetRole);
  const picked = selected.filter((p) => allowed.includes(p));
  if (picked.length === 0 || picked.length === allowed.length) return null;
  return picked;
}
