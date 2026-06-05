import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { CrmTasksService } from "../api/crm-tasks.service";
import { ActivitiesService } from "../api/activities.service";
import { CrmNotificationsService } from "../api/notifications.service";
import type { CreateCrmTaskDTO, UpdateCrmTaskDTO } from "../types/crm-tasks.types";
import { filterCrmRecordsByAccess } from "../utils/crm-access.utils";
import { normalizeCrmTaskStatus } from "../constants/crm-task.constants";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useCrmTasksQuery() {
  const { companyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: QUERY_KEYS.crm.crmTasks(companyId!),
    queryFn: async () => {
      const res = await CrmTasksService.getCrmTasks(companyId!);
      const data = filterCrmRecordsByAccess(
        res.data.map((t) => ({ ...t, status: normalizeCrmTaskStatus(t.status) })),
        user
      );
      return { ...res, data };
    },
    enabled: !!companyId,
  });
}

export function useCreateCrmTaskGlobalMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCrmTaskDTO) => {
      const res = await CrmTasksService.createCrmTask(companyId!, data);
      if (userId && data.entityId) {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Task created",
          description: data.title,
          entityType: data.entityType,
          entityId: data.entityId,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      if (data.assigneeId) {
        await CrmNotificationsService.createNotification(companyId!, {
          userId: data.assigneeId,
          type: "assignment",
          title: "Task assigned",
          body: data.title,
          entityType: "crm_task",
          entityId: res.data.id,
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      toast.success(t("crmTasks.toast.created"));
    },
    onError: () => toast.error(t("crmTasks.toast.createFailed")),
  });
}

export function useUpdateCrmTaskMutation() {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCrmTaskDTO }) => {
      const before = await CrmTasksService.getCrmTaskById(companyId!, id);
      const res = await CrmTasksService.updateCrmTask(companyId!, id, data);
      if (userId && data.status === "completed" && before.data.status !== "completed") {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Task completed",
          description: before.data.title,
          entityType: before.data.entityType,
          entityId: before.data.entityId,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.all });
      toast.success(t("crmTasks.toast.updated"));
    },
    onError: () => toast.error(t("crmTasks.toast.updateFailed")),
  });
}

export function useCrmTaskDashboard() {
  const { data } = useCrmTasksQuery();
  const tasks = data?.data ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isOpen = (s: string) => !["completed", "cancelled"].includes(normalizeCrmTaskStatus(s));

  return {
    today: tasks.filter((t) => {
      if (!isOpen(t.status) || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }),
    upcoming: tasks.filter((t) => {
      if (!isOpen(t.status) || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= tomorrow;
    }),
    overdue: tasks.filter((t) => {
      if (!isOpen(t.status) || !t.dueDate) return false;
      return new Date(t.dueDate) < today;
    }),
  };
}
