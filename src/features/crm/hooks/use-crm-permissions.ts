import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/features/auth/types/auth.types";
import { hasEffectivePermission } from "@/lib/permissions/effective-permissions";

export function useCrmPermissions() {
  const user = useAuthStore((s) => s.user);
  const ctx = {
    role: user?.role as UserRole | undefined,
    portalSubRoles: user?.portalSubRoles,
  };

  return {
    canViewCrm: hasEffectivePermission(ctx, "crm.view"),
    canManageLeads: hasEffectivePermission(ctx, "crm.manage_leads"),
    canManageContacts: hasEffectivePermission(ctx, "crm.manage_contacts"),
    canManageDeals: hasEffectivePermission(ctx, "crm.manage_deals"),
    canManageCrmTasks: hasEffectivePermission(ctx, "crm.manage_tasks"),
    canDeleteCrm: hasEffectivePermission(ctx, "crm.delete"),
  };
}
