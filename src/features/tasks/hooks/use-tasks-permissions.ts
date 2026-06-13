import { useAuthStore } from "@/stores/auth.store";
import { hasEffectivePermission } from "@/lib/permissions/effective-permissions";

function usePermissionContext() {
  const user = useAuthStore((s) => s.user);
  return {
    role: user?.role,
    portalSubRoles: user?.portalSubRoles,
  };
}

export function useCrmPermissions() {
  const ctx = usePermissionContext();

  return {
    canViewCrm: hasEffectivePermission(ctx, "crm.view"),
    canManageLeads: hasEffectivePermission(ctx, "crm.manage_leads"),
    canManageContacts: hasEffectivePermission(ctx, "crm.manage_contacts"),
    canManageDeals: hasEffectivePermission(ctx, "crm.manage_deals"),
    canManageCrmTasks: hasEffectivePermission(ctx, "crm.manage_tasks"),
    canDeleteCrm: hasEffectivePermission(ctx, "crm.delete"),
  };
}

export function useTasksPermissions() {
  const ctx = usePermissionContext();

  return {
    canViewTasks: hasEffectivePermission(ctx, "tasks.view"),
    canCreateTasks: hasEffectivePermission(ctx, "tasks.create"),
    canEditTasks: hasEffectivePermission(ctx, "tasks.edit"),
    canDeleteTasks: hasEffectivePermission(ctx, "tasks.delete"),
    canApproveTasks: hasEffectivePermission(ctx, "tasks.approve"),
  };
}
