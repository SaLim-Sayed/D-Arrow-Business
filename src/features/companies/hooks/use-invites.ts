import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { useAppPermissions } from "../hooks/use-app-permissions";
import { InvitesService } from "../api/invites.service";
import type { UserRole } from "@/features/auth/types/auth.types";

export function usePendingInvitesQuery() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["invites", "pending", companyId],
    queryFn: () => InvitesService.listPending(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateInviteMutation() {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const { role } = useAppPermissions();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: { email: string; role: UserRole }) => {
      if (!companyId || !user || !role) {
        throw new Error("Missing context");
      }
      return InvitesService.createInvite(role, {
        email: input.email,
        role: input.role,
        companyId,
        companyName: user.companyName || companyId,
        invitedBy: user.id,
        invitedByName: user.name,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["invites", "pending", companyId] });
      if (result.emailMode === "sent") {
        toast.success(t("team.invite.sent"));
      } else {
        toast.success(t("team.invite.createdWithLink"));
      }
    },
    onError: (error: Error) => {
      if (error.message === "USER_EXISTS") {
        toast.error(t("team.invite.userExists"));
        return;
      }
      if (error.message === "INVITE_EXISTS") {
        toast.error(t("team.invite.alreadyPending"));
        return;
      }
      toast.error(t("team.invite.sendError"));
    },
  });
}

export function useRevokeInviteMutation() {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: (token: string) => InvitesService.revoke(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", "pending", companyId] });
      toast.success(t("team.invite.deleted"));
    },
    onError: () => {
      toast.error(t("team.invite.deleteError"));
    },
  });
}

export function useDeleteAllInvitesMutation() {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Missing company");
      return InvitesService.deleteAllForCompany(companyId);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["invites", "pending", companyId] });
      toast.success(t("team.invite.deletedAll", { count }));
    },
    onError: () => {
      toast.error(t("team.invite.deleteError"));
    },
  });
}
