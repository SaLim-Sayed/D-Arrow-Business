import { STORAGE_KEYS } from "@/lib/constants";
import type { PortalId } from "@/lib/portal-permissions";
import { useAuthStore } from "@/stores/auth.store";
import {
  canAccessPortal,
  getAccessiblePortals,
  PORTAL_PATHS,
} from "@/lib/portal-permissions";
import type { UserRole } from "@/features/auth/types/auth.types";

export function getLastPortal(): PortalId | null {
  const v = localStorage.getItem(STORAGE_KEYS.LAST_PORTAL);
  if (v === "tasks" || v === "crm" || v === "people") return v;
  return null;
}

export function setLastPortal(portal: PortalId): void {
  localStorage.setItem(STORAGE_KEYS.LAST_PORTAL, portal);
}

export function useAccessiblePortals() {
  const role = useAuthStore((s) => s.user?.role) as UserRole | undefined;
  return getAccessiblePortals(role);
}

export function useCanAccessPortal(portal: PortalId) {
  const role = useAuthStore((s) => s.user?.role) as UserRole | undefined;
  return canAccessPortal(role, portal);
}

export function getLastPortalPath(role: UserRole | undefined): string | null {
  const last = getLastPortal();
  if (last && canAccessPortal(role, last)) return PORTAL_PATHS[last];
  return null;
}
