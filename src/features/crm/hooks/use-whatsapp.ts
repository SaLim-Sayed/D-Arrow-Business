import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { WhatsAppService } from "../api/whatsapp.service";
import { WhatsAppCloudService } from "../api/whatsapp-cloud.service";
import { ActivitiesService } from "../api/activities.service";
import type { CrmEntityType } from "../types/crm.common.types";
import type { CreateWhatsAppMessageDTO } from "../types/whatsapp.types";
import { toInternationalWhatsAppPhone } from "../utils/phone.utils";
import { WHATSAPP_BUSINESS_PHONE } from "../config/whatsapp.config";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function filterByEntity<T extends { entityType: string; entityId: string }>(
  items: T[],
  entityType: CrmEntityType,
  entityId: string
): T[] {
  return items.filter(
    (i) => i.entityType === entityType && i.entityId === entityId
  );
}

export function useWhatsAppApiStatus() {
  return useQuery({
    queryKey: ["crm", "whatsapp", "api-status"],
    queryFn: () => WhatsAppCloudService.getStatus(),
    staleTime: 60_000,
  });
}

export function useEntityWhatsAppMessages(
  entityType: CrmEntityType,
  entityId: string
) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.crm.whatsappMessages(companyId!, entityType, entityId),
    queryFn: async () => {
      const res = await WhatsAppService.getMessages(companyId!);
      return filterByEntity(res.data, entityType, entityId).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useLogWhatsAppMessageMutation(
  entityType: CrmEntityType,
  entityId: string,
  entityLabel: string
) {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      phone,
      body,
      logActivity = true,
      sendViaApi = false,
    }: {
      phone: string;
      body: string;
      logActivity?: boolean;
      sendViaApi?: boolean;
    }) => {
      if (!companyId || !userId) throw new Error("Not authenticated");

      let status: CreateWhatsAppMessageDTO["status"] = "manual";
      let externalId: string | null | undefined;

      if (sendViaApi) {
        const apiResult = await WhatsAppCloudService.sendMessage(phone, body);
        status = "sent";
        externalId = apiResult.messages?.[0]?.id ?? null;
      }

      const dto: CreateWhatsAppMessageDTO = {
        entityType,
        entityId,
        phone: toInternationalWhatsAppPhone(phone),
        fromPhone: WHATSAPP_BUSINESS_PHONE,
        direction: "outbound",
        body: body.trim(),
        status,
        externalId,
        userId,
      };

      const msgRes = await WhatsAppService.createMessage(companyId, dto);

      if (logActivity && body.trim()) {
        await ActivitiesService.createActivity(companyId, {
          type: "whatsapp",
          subject: t("whatsapp.activitySubject", { name: entityLabel }),
          description: body.trim(),
          entityType,
          entityId,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }

      return msgRes;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.crm.whatsappMessages(companyId!, entityType, entityId),
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.crm.activities(companyId!), entityType, entityId],
      });
      toast.success(
        variables.sendViaApi ? t("whatsapp.messageSent") : t("whatsapp.messageLogged")
      );
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("whatsapp.messageFailed");
      toast.error(message);
    },
  });
}
