import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth.store";
import { UsersService } from "../api/users.service";
import type { Permission } from "@/lib/permissions";

export function useUpdateUserCustomPermissionsMutation() {
  const { i18n } = useTranslation("settings");
  const isAr = i18n.language === "ar";
  const actor = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      customPermissions,
    }: {
      targetUserId: string;
      customPermissions: Permission[];
    }) => {
      if (!actor?.role) throw new Error("Not authenticated");

      await UsersService.updateUserCustomPermissions(
        actor.role,
        targetUserId,
        customPermissions
      );
      return {
        targetUserId,
        customPermissions,
      };
    },
    onSuccess: ({ targetUserId, customPermissions }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      if (targetUserId === actor?.id) {
        updateUser({
          customPermissions,
        });
      }

      toast.success(isAr ? "تم إسناد وحفظ الصلاحيات المخصصة بنجاح! 🎉" : "Custom permissions updated successfully! 🎉");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update custom permissions";
      toast.error(message);
    },
  });
}
