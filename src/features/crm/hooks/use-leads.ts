import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { LeadsService } from "../api/leads.service";
import { ActivitiesService } from "../api/activities.service";
import type { CreateLeadDTO, UpdateLeadDTO } from "../types/leads.types";
import { buildLeadCreatedActivity, buildLeadUpdateActivity } from "../utils/lead-activity-log";
import { filterCrmRecordsByAccess } from "../utils/crm-access.utils";
import { CrmNotificationsService } from "../api/notifications.service";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useLeadsQuery() {
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: QUERY_KEYS.crm.leads(companyId!),
    queryFn: async () => {
      const res = await LeadsService.getLeads(companyId!);
      return { ...res, data: filterCrmRecordsByAccess(res.data, user) };
    },
    enabled: !!companyId,
  });
}

export function useLeadQuery(leadId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: QUERY_KEYS.crm.lead(leadId),
    queryFn: () => LeadsService.getLeadById(companyId!, leadId),
    enabled: !!companyId && !!leadId,
  });
}

export function useCreateLeadMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLeadDTO) => {
      const res = await LeadsService.createLead(companyId!, data);
      if (userId) {
        await ActivitiesService.createActivity(
          companyId!,
          buildLeadCreatedActivity(res.data.id, data.name, userId)
        );
        if (data.assignedTo && data.assignedTo !== userId) {
          await CrmNotificationsService.createNotification(companyId!, {
            userId: data.assignedTo,
            type: "lead_assigned",
            title: "Lead assigned",
            body: `You were assigned lead "${data.name}"`,
            entityType: "lead",
            entityId: res.data.id,
          });
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      toast.success(t("leads.toast.created"));
    },
    onError: () => toast.error(t("leads.toast.createFailed")),
  });
}

export function useUpdateLeadMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeadDTO }) => {
      const before = await LeadsService.getLeadById(companyId!, id);
      const res = await LeadsService.updateLead(companyId!, id, data);
      if (userId) {
        const activity = buildLeadUpdateActivity(before.data, data, userId);
        if (activity) {
          await ActivitiesService.createActivity(companyId!, activity);
        }
      }
      return res;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.lead(id) });
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.activities(companyId) });
      }
      toast.success(t("leads.toast.updated"));
    },
    onError: () => toast.error(t("leads.toast.updateFailed")),
  });
}
