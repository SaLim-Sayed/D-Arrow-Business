import { STORAGE_KEYS } from "@/lib/constants";
import type { PortalId } from "@/lib/portal-permissions";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/features/auth/types/auth.types";
import {
  canAccessPortal,
  getAccessiblePortals,
  PORTAL_PATHS,
} from "@/lib/portal-permissions";

export function getLastPortal(): PortalId | null {
  const v = localStorage.getItem(STORAGE_KEYS.LAST_PORTAL);
  if (
    v === "tasks" ||
    v === "crm" ||
    v === "people" ||
    v === "billing" ||
    v === "chat"
  ) {
    return v;
  }
  return null;
}

export function setLastPortal(portal: PortalId): void {
  localStorage.setItem(STORAGE_KEYS.LAST_PORTAL, portal);
}

export function useAccessiblePortals() {
  const user = useAuthStore((s) => s.user);
  return getAccessiblePortals(user?.role, user?.portalAccess);
}

export function useCanAccessPortal(portal: PortalId) {
  const user = useAuthStore((s) => s.user);
  return canAccessPortal(user?.role, portal, user?.portalAccess);
}

export function getLastPortalPath(
  role: UserRole | undefined,
  portalAccess?: PortalId[] | null
): string | null {
  const last = getLastPortal();
  if (last && canAccessPortal(role, last, portalAccess)) {
    return PORTAL_PATHS[last];
  }
  return null;
}

export function useLastPortalPath(): string | null {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return getLastPortalPath(user.role, user.portalAccess);
}
