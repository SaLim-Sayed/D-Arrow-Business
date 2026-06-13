import type { UserRole } from "@/features/auth/types/auth.types";

export type Permission =
  | "portals.tasks"
  | "portals.crm"
  | "portals.people"
  | "company.view"
  | "company.manage"
  | "pricing.view"
  | "pricing.manage"
  | "users.manage_roles"
  | "people.view"
  | "people.manage_employees"
  | "people.approve_leave"
  | "people.view_performance"
  | "crm.view"
  | "crm.manage_leads"
  | "crm.manage_contacts"
  | "crm.manage_deals"
  | "crm.manage_tasks"
  | "crm.delete"
  | "admin.seed"
  | "tasks.view"
  | "tasks.create"
  | "tasks.edit"
  | "tasks.delete"
  | "tasks.approve";

export const ROLE_LABELS: Record<UserRole, { en: string; ar: string }> = {
  super_admin: { en: "Super Admin", ar: "مدير عام" },
  admin: { en: "Admin", ar: "مسؤول" },
  manager: { en: "Manager", ar: "مدير" },
  employee: { en: "Employee", ar: "موظف" },
  viewer: { en: "Viewer", ar: "مشاهد" },
};

const ALL_PERMISSIONS: Permission[] = [
  "portals.tasks",
  "portals.crm",
  "portals.people",
  "company.view",
  "company.manage",
  "pricing.view",
  "pricing.manage",
  "users.manage_roles",
  "people.view",
  "people.manage_employees",
  "people.approve_leave",
  "people.view_performance",
  "crm.view",
  "crm.manage_leads",
  "crm.manage_contacts",
  "crm.manage_deals",
  "crm.manage_tasks",
  "crm.delete",
  "admin.seed",
  "tasks.view",
  "tasks.create",
  "tasks.edit",
  "tasks.delete",
  "tasks.approve",
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((p) => p !== "admin.seed"),
  manager: [
    "portals.tasks",
    "portals.crm",
    "portals.people",
    "company.view",
    "pricing.view",
    "pricing.manage",
    "people.view",
    "people.manage_employees",
    "people.approve_leave",
    "people.view_performance",
    "crm.view",
    "crm.manage_leads",
    "crm.manage_contacts",
    "crm.manage_deals",
    "crm.manage_tasks",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.approve",
  ],
  employee: [
    "portals.tasks",
    "portals.crm",
    "portals.people",
    "company.view",
    "pricing.view",
    "people.view",
    "crm.view",
    "crm.manage_tasks",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
  ],
  viewer: ["portals.crm", "company.view", "pricing.view", "crm.view"],
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole | undefined,
  permissions: readonly Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === "super_admin" || role === "admin";
}

export function isManagerRole(role: UserRole | undefined): boolean {
  return isAdminRole(role) || role === "manager";
}

export function canAccessPortal(
  role: UserRole | undefined,
  portal: "tasks" | "crm" | "people"
): boolean {
  return hasPermission(role, `portals.${portal}` as Permission);
}

export function getAccessiblePortals(
  role: UserRole | undefined
): Array<"tasks" | "crm" | "people"> {
  return (["tasks", "crm", "people"] as const).filter((p) =>
    canAccessPortal(role, p)
  );
}
