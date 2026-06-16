import type { UserRole } from "@/features/auth/types/auth.types";
import {
  canUserAccessPortal,
  resolveUserPortals,
} from "@/lib/permissions/portal-access";

export type PortalId = "tasks" | "crm" | "people" | "billing";

export const PORTAL_PATHS: Record<PortalId, string> = {
  tasks: "/tasks",
  crm: "/crm",
  people: "/people",
  billing: "/billing",
};

/** @deprecated Use ROLE_PERMISSIONS from @/lib/permissions */
export const PORTAL_ACCESS: Record<PortalId, readonly UserRole[]> = {
  tasks: ["super_admin", "admin", "manager", "employee"],
  crm: ["super_admin", "admin", "manager", "employee", "viewer"],
  people: ["super_admin", "admin", "manager", "employee"],
  billing: ["super_admin", "admin", "manager"],
};

export function canAccessPortal(
  role: UserRole | undefined,
  portal: PortalId,
  portalAccess?: PortalId[] | null
): boolean {
  return canUserAccessPortal(role, portal, portalAccess);
}

export function getAccessiblePortals(
  role: UserRole | undefined,
  portalAccess?: PortalId[] | null
): PortalId[] {
  return resolveUserPortals(role, portalAccess);
}

export function getPortalFromPath(pathname: string): PortalId | "picker" | "settings" | null {
  if (pathname === "/" || pathname === "") return "picker";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/people")) return "people";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname === "/profile" || pathname === "/seed") return null;
  return null;
}

export function getDefaultPortalPath(
  role: UserRole | undefined,
  portalAccess?: PortalId[] | null
): string {
  const portals = getAccessiblePortals(role, portalAccess);
  if (portals.length === 1) return PORTAL_PATHS[portals[0]];
  return "/";
}
