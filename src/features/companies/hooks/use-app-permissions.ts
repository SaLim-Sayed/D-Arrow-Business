import { useAuthStore } from "@/stores/auth.store";
import {
  hasEffectivePermission,
  hasAnyEffectivePermission,
} from "@/lib/permissions/effective-permissions";
import {
  isAdminRole,
  isManagerRole,
  type Permission,
} from "@/lib/permissions";

export function useAppPermissions() {
  const user = useAuthStore((s) => s.user);
  const ctx = {
    role: user?.role,
    portalSubRoles: user?.portalSubRoles,
  };

  return {
    role: user?.role,
    isAdmin: isAdminRole(user?.role),
    isManager: isManagerRole(user?.role),
    can: (permission: Permission) => hasEffectivePermission(ctx, permission),
    canAny: (permissions: readonly Permission[]) =>
      hasAnyEffectivePermission(ctx, permissions),
    canManageCompany: hasEffectivePermission(ctx, "company.manage"),
    canManageCompanyIdentity: hasEffectivePermission(ctx, "company.identity"),
    canViewCompany: hasEffectivePermission(ctx, "company.view"),
    canManagePricing: hasEffectivePermission(ctx, "pricing.manage"),
    canViewPricing: hasEffectivePermission(ctx, "pricing.view"),
    canManageRoles: hasEffectivePermission(ctx, "users.manage_roles"),
    canApproveLeave: hasEffectivePermission(ctx, "people.approve_leave"),
    canManageEmployees: hasEffectivePermission(ctx, "people.manage_employees"),
    canViewPerformance: hasEffectivePermission(ctx, "people.view_performance"),
    canAccessSeed: hasEffectivePermission(ctx, "admin.seed"),
  };
}
