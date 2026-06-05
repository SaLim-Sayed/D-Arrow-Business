import type { UserRole } from "@/features/auth/types/auth.types";

export type PortalId = "tasks" | "crm" | "people";

export const PORTAL_PATHS: Record<PortalId, string> = {
  tasks: "/tasks",
  crm: "/crm",
  people: "/people",
};

export const PORTAL_ACCESS: Record<PortalId, readonly UserRole[]> = {
  tasks: ["super_admin", "admin", "manager", "employee"],
  crm: ["super_admin", "admin", "manager", "employee", "viewer"],
  people: ["super_admin", "admin", "manager", "employee"],
};

export function canAccessPortal(
  role: UserRole | undefined,
  portal: PortalId
): boolean {
  if (!role) return false;
  return PORTAL_ACCESS[portal].includes(role);
}

export function getAccessiblePortals(role: UserRole | undefined): PortalId[] {
  if (!role) return [];
  return (Object.keys(PORTAL_ACCESS) as PortalId[]).filter((p) =>
    canAccessPortal(role, p)
  );
}

export function getPortalFromPath(pathname: string): PortalId | "picker" | null {
  if (pathname === "/" || pathname === "") return "picker";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/people")) return "people";
  if (pathname === "/profile" || pathname === "/seed") return null;
  return null;
}

export function getDefaultPortalPath(role: UserRole | undefined): string {
  const portals = getAccessiblePortals(role);
  if (portals.length === 1) return PORTAL_PATHS[portals[0]];
  return "/";
}
