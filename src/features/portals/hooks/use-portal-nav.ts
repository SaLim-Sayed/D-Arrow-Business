import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { PortalId } from "@/lib/portal-permissions";
import { getNavForPortal, type PortalNavItem } from "@/lib/portal-nav";
import { hasEffectivePermission } from "@/lib/permissions/effective-permissions";

/** Portal nav filtered by the current user's effective permissions. */
export function usePortalNav(portal: PortalId): PortalNavItem[] {
  const user = useAuthStore((s) => s.user);
  const ctx = {
    role: user?.role as UserRole | undefined,
    portalSubRoles: user?.portalSubRoles,
  };

  return useMemo(() => {
    return getNavForPortal(portal).filter((item) => {
      if (!item.permission) return true;
      return hasEffectivePermission(ctx, item.permission);
    });
  }, [portal, ctx.role, user?.portalSubRoles]);
}
