import type { PortalId } from "@/lib/portal-permissions";
import type { Permission } from "./index";

export type TasksSubRole = "admin" | "manager" | "member" | "viewer";
export type CrmSubRole = "admin" | "manager" | "sales" | "viewer";
export type PeopleSubRole = "admin" | "manager" | "hr" | "employee";

export type PortalSubRole = TasksSubRole | CrmSubRole | PeopleSubRole;

export interface PortalSubRoles {
  tasks?: TasksSubRole;
  crm?: CrmSubRole;
  people?: PeopleSubRole;
}

const TASKS_SUB_ROLE_PERMISSIONS: Record<TasksSubRole, readonly Permission[]> = {
  admin: [
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.delete",
    "tasks.approve",
  ],
  manager: ["tasks.view", "tasks.create", "tasks.edit", "tasks.approve"],
  member: ["tasks.view", "tasks.create", "tasks.edit"],
  viewer: ["tasks.view"],
};

const CRM_SUB_ROLE_PERMISSIONS: Record<CrmSubRole, readonly Permission[]> = {
  admin: [
    "crm.view",
    "crm.manage_leads",
    "crm.manage_contacts",
    "crm.manage_deals",
    "crm.manage_tasks",
    "crm.delete",
  ],
  manager: [
    "crm.view",
    "crm.manage_leads",
    "crm.manage_contacts",
    "crm.manage_deals",
    "crm.manage_tasks",
  ],
  sales: ["crm.view", "crm.manage_leads", "crm.manage_tasks"],
  viewer: ["crm.view"],
};

const PEOPLE_SUB_ROLE_PERMISSIONS: Record<PeopleSubRole, readonly Permission[]> = {
  admin: [
    "people.view",
    "people.manage_employees",
    "people.approve_leave",
    "people.view_performance",
  ],
  manager: [
    "people.view",
    "people.manage_employees",
    "people.approve_leave",
    "people.view_performance",
  ],
  hr: ["people.view", "people.manage_employees", "people.approve_leave"],
  employee: ["people.view"],
};

export const PORTAL_SUB_ROLE_OPTIONS: Record<PortalId, readonly PortalSubRole[]> = {
  tasks: ["admin", "manager", "member", "viewer"],
  crm: ["admin", "manager", "sales", "viewer"],
  people: ["admin", "manager", "hr", "employee"],
};

const DEFAULT_SUB_ROLES_BY_GLOBAL: Partial<
  Record<import("@/features/auth/types/auth.types").UserRole, PortalSubRoles>
> = {
  super_admin: { tasks: "admin", crm: "admin", people: "admin" },
  admin: { tasks: "admin", crm: "admin", people: "admin" },
  manager: { tasks: "manager", crm: "manager", people: "manager" },
  employee: { tasks: "member", crm: "sales", people: "employee" },
  viewer: { crm: "viewer" },
};

export function getSubRolePermissions(
  portal: PortalId,
  subRole: PortalSubRole
): readonly Permission[] {
  switch (portal) {
    case "tasks":
      return TASKS_SUB_ROLE_PERMISSIONS[subRole as TasksSubRole] ?? [];
    case "crm":
      return CRM_SUB_ROLE_PERMISSIONS[subRole as CrmSubRole] ?? [];
    case "people":
      return PEOPLE_SUB_ROLE_PERMISSIONS[subRole as PeopleSubRole] ?? [];
  }
}

export function getDefaultSubRole(
  portal: PortalId,
  globalRole: import("@/features/auth/types/auth.types").UserRole
): PortalSubRole | undefined {
  return DEFAULT_SUB_ROLES_BY_GLOBAL[globalRole]?.[portal];
}

export function resolvePortalSubRole(
  portal: PortalId,
  globalRole: import("@/features/auth/types/auth.types").UserRole,
  portalSubRoles?: PortalSubRoles | null
): PortalSubRole | undefined {
  return portalSubRoles?.[portal] ?? getDefaultSubRole(portal, globalRole);
}

export function permissionPortal(permission: Permission): PortalId | null {
  if (permission.startsWith("tasks.")) return "tasks";
  if (permission.startsWith("crm.")) return "crm";
  if (permission.startsWith("people.")) return "people";
  return null;
}

export function parsePortalSubRoles(raw: unknown): PortalSubRoles | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Record<string, unknown>;
  const result: PortalSubRoles = {};

  if (
    typeof data.tasks === "string" &&
    PORTAL_SUB_ROLE_OPTIONS.tasks.includes(data.tasks as TasksSubRole)
  ) {
    result.tasks = data.tasks as TasksSubRole;
  }
  if (
    typeof data.crm === "string" &&
    PORTAL_SUB_ROLE_OPTIONS.crm.includes(data.crm as CrmSubRole)
  ) {
    result.crm = data.crm as CrmSubRole;
  }
  if (
    typeof data.people === "string" &&
    PORTAL_SUB_ROLE_OPTIONS.people.includes(data.people as PeopleSubRole)
  ) {
    result.people = data.people as PeopleSubRole;
  }

  return Object.keys(result).length ? result : undefined;
}
