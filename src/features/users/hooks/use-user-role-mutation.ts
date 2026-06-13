import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { useCompany } from "@/features/companies/context/company-context";
import type { UserRole } from "@/features/auth/types/auth.types";
import { UsersService } from "../api/users.service";

export function useUpdateUserRoleMutation() {
  const { t } = useTranslation("settings");
  const { companyId } = useCompany();
  const actor = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      newRole,
    }: {
      targetUserId: string;
      newRole: UserRole;
    }) => {
      if (!companyId || !actor?.id || !actor.role) {
        throw new Error("Not authenticated");
      }
      await UsersService.updateUserRole(
        companyId,
        actor.id,
        actor.role,
        targetUserId,
        newRole
      );
      return { targetUserId, newRole };
    },
    onSuccess: ({ targetUserId, newRole }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["people"] });

      if (targetUserId === actor?.id) {
        updateUser({ role: newRole });
      }

      toast.success(t("team.roleUpdated"));
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t("team.roleUpdateError");
      toast.error(message);
    },
  });
}
