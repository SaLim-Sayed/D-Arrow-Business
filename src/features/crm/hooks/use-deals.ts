import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { DealsService } from "../api/deals.service";
import { ActivitiesService } from "../api/activities.service";
import { CrmNotificationsService } from "../api/notifications.service";
import type { CreateDealDTO, Deal, UpdateDealDTO } from "../types/deals.types";
import { filterCrmRecordsByAccess } from "../utils/crm-access.utils";
import { normalizeDealStage, DEAL_STAGE_PROBABILITY } from "../constants/deal-workflow";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

async function notifyDealAssignee(
  companyId: string,
  deal: Deal,
  assigneeId: string | null | undefined,
  type: "assignment" | "deal_stage" | "general",
  title: string,
  body: string
) {
  if (!assigneeId) return;
  await CrmNotificationsService.createNotification(companyId, {
    userId: assigneeId,
    type,
    title,
    body,
    entityType: "deal",
    entityId: deal.id,
  });
}

export function useDealsQuery() {
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: QUERY_KEYS.crm.deals(companyId!),
    queryFn: async () => {
      const res = await DealsService.getDeals(companyId!);
      const data = filterCrmRecordsByAccess(
        res.data.map((d) => ({ ...d, stage: normalizeDealStage(d.stage) })),
        user
      );
      return { ...res, data };
    },
    enabled: !!companyId,
  });
}

export function useDealQuery(dealId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["crm", "deal", dealId],
    queryFn: async () => {
      const res = await DealsService.getDealById(companyId!, dealId);
      return { ...res, data: { ...res.data, stage: normalizeDealStage(res.data.stage) } };
    },
    enabled: !!companyId && !!dealId,
  });
}

export function useCreateDealMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDealDTO) => {
      const payload = {
        ...data,
        probability: data.probability || DEAL_STAGE_PROBABILITY[data.stage],
      };
      const res = await DealsService.createDeal(companyId!, payload);
      if (userId) {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Deal created",
          description: data.title,
          entityType: "deal",
          entityId: res.data.id,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      await notifyDealAssignee(
        companyId!,
        res.data,
        data.assignedTo,
        "assignment",
        "Deal assigned",
        `You were assigned to deal "${data.title}"`
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      toast.success(t("deals.toast.created"));
    },
    onError: () => toast.error(t("deals.toast.createFailed")),
  });
}

export function useUpdateDealMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDealDTO }) => {
      const before = await DealsService.getDealById(companyId!, id);
      const res = await DealsService.updateDeal(companyId!, id, data);
      if (userId) {
        const stageChanged = data.stage && data.stage !== normalizeDealStage(before.data.stage);
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: stageChanged ? "Deal stage changed" : "Deal updated",
          description: stageChanged
            ? `${normalizeDealStage(before.data.stage)} → ${data.stage}`
            : before.data.title,
          entityType: "deal",
          entityId: id,
          occurredAt: new Date().toISOString(),
          userId,
        });
        if (data.stage === "won") {
          await notifyDealAssignee(
            companyId!,
            res.data,
            res.data.assignedTo,
            "general",
            "Deal won",
            `Deal "${res.data.title}" was won`
          );
        }
        if (data.stage === "lost") {
          await notifyDealAssignee(
            companyId!,
            res.data,
            res.data.assignedTo,
            "general",
            "Deal lost",
            `Deal "${res.data.title}" was lost`
          );
        }
      }
      if (data.assignedTo && data.assignedTo !== before.data.assignedTo) {
        await notifyDealAssignee(
          companyId!,
          res.data,
          data.assignedTo,
          "assignment",
          "Deal assigned",
          `You were assigned to deal "${res.data.title}"`
        );
      }
      return res;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      queryClient.invalidateQueries({ queryKey: ["crm", "deal", id] });
      toast.success(t("deals.toast.updated"));
    },
    onError: () => toast.error(t("deals.toast.updateFailed")),
  });
}

export function useUpdateDealStageMutation() {
  const update = useUpdateDealMutation();
  return {
    ...update,
    mutate: ({ id, stage }: { id: string; stage: UpdateDealDTO["stage"] }) =>
      update.mutate({
        id,
        data: {
          stage,
          probability: stage ? DEAL_STAGE_PROBABILITY[stage] : undefined,
        },
      }),
    mutateAsync: ({ id, stage }: { id: string; stage: UpdateDealDTO["stage"] }) =>
      update.mutateAsync({
        id,
        data: {
          stage,
          probability: stage ? DEAL_STAGE_PROBABILITY[stage] : undefined,
        },
      }),
  };
}
