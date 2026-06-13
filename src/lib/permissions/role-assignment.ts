import type { UserRole } from "@/features/auth/types/auth.types";

const ALL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "manager",
  "employee",
  "viewer",
];

/** Roles the actor may assign to another user. */
export function getAssignableRoles(actorRole: UserRole | undefined): UserRole[] {
  if (actorRole === "super_admin") return ALL_ROLES;
  if (actorRole === "admin") {
    return ALL_ROLES.filter((r) => r !== "super_admin");
  }
  return [];
}

export function canAssignRole(
  actorRole: UserRole | undefined,
  newRole: UserRole
): boolean {
  return getAssignableRoles(actorRole).includes(newRole);
}

export function canManageUserRole(
  actorRole: UserRole | undefined,
  actorId: string,
  targetUserId: string
): boolean {
  if (!getAssignableRoles(actorRole).length) return false;
  // Super admin can change anyone; others cannot change their own role here
  if (actorRole === "super_admin") return true;
  return actorId !== targetUserId;
}
