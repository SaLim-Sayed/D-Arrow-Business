import type { UserRole } from "@/features/auth/types/auth.types";

export const CRM_PERMISSIONS = {
  view: ["super_admin", "admin", "manager", "employee", "viewer"] as UserRole[],
  manageLeads: ["super_admin", "admin", "manager"] as UserRole[],
  manageContacts: ["super_admin", "admin", "manager"] as UserRole[],
  manageDeals: ["super_admin", "admin", "manager"] as UserRole[],
  manageCrmTasks: ["super_admin", "admin", "manager", "employee"] as UserRole[],
  delete: ["super_admin", "admin"] as UserRole[],
} as const;

export function crmRoleAllowed(role: UserRole | undefined, allowed: readonly UserRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
