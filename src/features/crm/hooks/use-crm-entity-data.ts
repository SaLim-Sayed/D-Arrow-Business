import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { ActivitiesService } from "../api/activities.service";
import { NotesService } from "../api/notes.service";
import { CrmTasksService } from "../api/crm-tasks.service";
import { AttachmentsService } from "../api/attachments.service";
import { uploadCrmAttachment } from "../api/crm-storage.service";
import type { CrmEntityType } from "../types/crm.common.types";
import type { CreateActivityDTO } from "../types/activities.types";
import type { CreateCrmTaskDTO, CrmTaskType } from "../types/crm-tasks.types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function filterByEntity<T extends { entityType: string; entityId: string }>(
  items: T[],
  entityType: CrmEntityType,
  entityId: string
): T[] {
  return items.filter((i) => i.entityType === entityType && i.entityId === entityId);
}

export function useCrmEntityActivities(entityType: CrmEntityType, entityId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: [...QUERY_KEYS.crm.activities(companyId!), entityType, entityId],
    queryFn: async () => {
      const res = await ActivitiesService.getActivities(companyId!);
      return filterByEntity(res.data, entityType, entityId).sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useCrmEntityNotes(entityType: CrmEntityType, entityId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: [...QUERY_KEYS.crm.notes(companyId!), entityType, entityId],
    queryFn: async () => {
      const res = await NotesService.getNotes(companyId!);
      return filterByEntity(res.data, entityType, entityId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useCrmEntityTasks(entityType: CrmEntityType, entityId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: [...QUERY_KEYS.crm.crmTasks(companyId!), entityType, entityId],
    queryFn: async () => {
      const res = await CrmTasksService.getCrmTasks(companyId!);
      return filterByEntity(res.data, entityType, entityId);
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useCrmEntityAttachments(entityType: CrmEntityType, entityId: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["crm", companyId, "attachments", entityType, entityId],
    queryFn: async () => {
      const res = await AttachmentsService.getAttachments(companyId!);
      return filterByEntity(res.data, entityType, entityId);
    },
    enabled: !!companyId && !!entityId,
  });
}

export function useCreateCrmNoteMutation(entityType: CrmEntityType, entityId: string) {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const authorId = useAuthStore((s) => s.user?.id);
  const userId = authorId;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!authorId) throw new Error("Not authenticated");
      const note = await NotesService.createNote(companyId!, {
        content: content.trim(),
        entityType,
        entityId,
        authorId,
      });
      if (userId) {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Note added",
          description: content.trim().slice(0, 200),
          entityType,
          entityId,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.notes(companyId!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.activities(companyId!) });
      toast.success(t("leadDetail.notes.saved"));
    },
    onError: () => toast.error(t("leadDetail.notes.failed")),
  });
}

export function useUpdateCrmNoteMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      NotesService.updateNote(companyId!, id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.notes(companyId!) });
    },
  });
}

export function useDeleteCrmNoteMutation() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotesService.deleteNote(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.notes(companyId!) });
    },
  });
}

export function useCreateCrmActivityMutation(entityType: CrmEntityType, entityId: string) {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<CreateActivityDTO, "entityType" | "entityId" | "userId" | "occurredAt">) => {
      if (!userId) throw new Error("Not authenticated");
      return ActivitiesService.createActivity(companyId!, {
        ...dto,
        entityType,
        entityId,
        userId,
        occurredAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.activities(companyId!) });
      toast.success(t("leadDetail.activities.saved"));
    },
    onError: () => toast.error(t("leadDetail.activities.failed")),
  });
}

export function useCreateCrmTaskMutation(entityType: CrmEntityType, entityId: string) {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      title: string;
      taskType?: CrmTaskType;
      description?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
      priority?: CreateCrmTaskDTO["priority"];
    }) => {
      const payload: CreateCrmTaskDTO = {
        title: dto.title,
        description: dto.description ?? "",
        taskType: dto.taskType ?? "follow_up",
        status: "pending",
        priority: dto.priority ?? "medium",
        entityType,
        entityId,
        assigneeId: dto.assigneeId ?? null,
        dueDate: dto.dueDate ?? null,
        ownerId: null,
        tags: [],
      };
      const task = await CrmTasksService.createCrmTask(companyId!, payload);
      if (userId) {
        await ActivitiesService.createActivity(companyId!, {
          type: "note",
          subject: "Task created",
          description: dto.title,
          entityType,
          entityId,
          occurredAt: new Date().toISOString(),
          userId,
        });
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.crmTasks(companyId!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.activities(companyId!) });
      toast.success(t("leadDetail.tasks.saved"));
    },
    onError: () => toast.error(t("leadDetail.tasks.failed")),
  });
}

export function useUploadCrmAttachmentMutation(entityType: CrmEntityType, entityId: string) {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const uploadedBy = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!uploadedBy || !companyId) throw new Error("Not authenticated");
      const uploaded = await uploadCrmAttachment(companyId, entityType, entityId, file);
      const att = await AttachmentsService.createAttachment(companyId, {
        entityType,
        entityId,
        fileName: file.name,
        fileUrl: uploaded.fileUrl,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        uploadedBy,
      });
      await ActivitiesService.createActivity(companyId, {
        type: "note",
        subject: "File uploaded",
        description: file.name,
        entityType,
        entityId,
        occurredAt: new Date().toISOString(),
        userId: uploadedBy,
      });
      return att;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", companyId, "attachments"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.crm.activities(companyId!) });
      toast.success(t("leadDetail.attachments.saved"));
    },
    onError: () => toast.error(t("leadDetail.attachments.failed")),
  });
}

export function useDeleteCrmAttachmentMutation(entityType: CrmEntityType, entityId: string) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AttachmentsService.deleteAttachment(companyId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", companyId, "attachments", entityType, entityId] });
    },
  });
}

// Backward-compatible lead-specific aliases
export const useLeadActivities = (leadId: string) => useCrmEntityActivities("lead", leadId);
export const useLeadNotes = (leadId: string) => useCrmEntityNotes("lead", leadId);
export const useLeadCrmTasks = (leadId: string) => useCrmEntityTasks("lead", leadId);
export const useLeadAttachments = (leadId: string) => useCrmEntityAttachments("lead", leadId);
export const useCreateLeadNoteMutation = (leadId: string) => useCreateCrmNoteMutation("lead", leadId);
export const useCreateLeadActivityMutation = (leadId: string) => useCreateCrmActivityMutation("lead", leadId);
export const useCreateLeadCrmTaskMutation = (leadId: string) => useCreateCrmTaskMutation("lead", leadId);
