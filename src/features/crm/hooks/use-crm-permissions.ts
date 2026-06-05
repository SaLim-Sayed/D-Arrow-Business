import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/features/auth/types/auth.types";
import { CRM_PERMISSIONS, crmRoleAllowed } from "../constants/crm-permissions";

export function useCrmPermissions() {
  const role = useAuthStore((s) => s.user?.role) as UserRole | undefined;

  return {
    canViewCrm: crmRoleAllowed(role, CRM_PERMISSIONS.view),
    canManageLeads: crmRoleAllowed(role, CRM_PERMISSIONS.manageLeads),
    canManageContacts: crmRoleAllowed(role, CRM_PERMISSIONS.manageContacts),
    canManageDeals: crmRoleAllowed(role, CRM_PERMISSIONS.manageDeals),
    canManageCrmTasks: crmRoleAllowed(role, CRM_PERMISSIONS.manageCrmTasks),
    canDeleteCrm: crmRoleAllowed(role, CRM_PERMISSIONS.delete),
  };
}
