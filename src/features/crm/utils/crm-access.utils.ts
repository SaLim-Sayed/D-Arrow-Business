import type { User, UserRole } from "@/features/auth/types/auth.types";

const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
const MANAGER_ROLES: UserRole[] = ["super_admin", "admin", "manager"];

export interface CrmAssignableRecord {
  ownerId?: string | null;
  assignedTo?: string | null;
  assigneeId?: string | null;
}

export function isCrmAdmin(role?: UserRole): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isCrmManager(role?: UserRole): boolean {
  return !!role && MANAGER_ROLES.includes(role);
}

export function getCrmAssigneeId(record: CrmAssignableRecord): string | null {
  return record.assignedTo ?? record.assigneeId ?? record.ownerId ?? null;
}

/** Sales (employee) sees only assigned records; managers/admins see all. */
export function canAccessCrmRecord(
  record: CrmAssignableRecord,
  user: User | null | undefined
): boolean {
  if (!user) return false;
  if (isCrmManager(user.role)) return true;
  if (user.role === "viewer") return true;
  const assignee = getCrmAssigneeId(record);
  if (user.role === "employee") return assignee === user.id;
  return true;
}

export function filterCrmRecordsByAccess<T extends CrmAssignableRecord>(
  records: T[],
  user: User | null | undefined
): T[] {
  if (!user || isCrmManager(user.role) || user.role === "viewer") return records;
  if (user.role === "employee") {
    return records.filter((r) => getCrmAssigneeId(r) === user.id);
  }
  return records;
}
