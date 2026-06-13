import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import type { PortalId } from "@/lib/portal-permissions";
import { UsersService } from "../api/users.service";
import { normalizePortalAccessForSave } from "@/lib/permissions/portal-access";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { PortalSubRoles } from "@/lib/permissions/sub-roles";

export function useUpdateUserPortalAccessMutation() {
  const { t } = useTranslation("settings");
  const actor = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      targetRole,
      selectedPortals,
      portalSubRoles,
    }: {
      targetUserId: string;
      targetRole: UserRole;
      selectedPortals: PortalId[];
      portalSubRoles?: PortalSubRoles;
    }) => {
      if (!actor?.role) throw new Error("Not authenticated");

      const normalized = normalizePortalAccessForSave(targetRole, selectedPortals);
      await UsersService.updateUserPortalAccess(
        actor.role,
        targetUserId,
        normalized,
        portalSubRoles
      );
      return {
        targetUserId,
        portalAccess: normalized ?? undefined,
        portalSubRoles,
      };
    },
    onSuccess: ({ targetUserId, portalAccess, portalSubRoles }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      if (targetUserId === actor?.id) {
        updateUser({
          portalAccess,
          ...(portalSubRoles !== undefined ? { portalSubRoles } : {}),
        });
      }

      toast.success(t("team.portalsUpdated"));
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t("team.portalsUpdateError");
      toast.error(message);
    },
  });
}
