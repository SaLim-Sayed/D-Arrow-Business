import type { CrmEntityType } from "../types/crm.common.types";
import { NotesService } from "./notes.service";
import { AttachmentsService } from "./attachments.service";
import { CrmTasksService } from "./crm-tasks.service";
import { ActivitiesService } from "./activities.service";

export async function reassignCrmEntities(
  companyId: string,
  fromType: CrmEntityType,
  fromId: string,
  toType: CrmEntityType,
  toId: string
): Promise<void> {
  const [notes, attachments, tasks, activities] = await Promise.all([
    NotesService.getNotes(companyId),
    AttachmentsService.getAttachments(companyId),
    CrmTasksService.getCrmTasks(companyId),
    ActivitiesService.getActivities(companyId),
  ]);

  await Promise.all([
    ...notes.data
      .filter((n) => n.entityType === fromType && n.entityId === fromId)
      .map((n) =>
        NotesService.updateNote(companyId, n.id, {
          entityType: toType,
          entityId: toId,
        })
      ),
    ...attachments.data
      .filter((a) => a.entityType === fromType && a.entityId === fromId)
      .map((a) =>
        AttachmentsService.updateAttachment(companyId, a.id, {
          entityType: toType,
          entityId: toId,
        })
      ),
    ...tasks.data
      .filter((t) => t.entityType === fromType && t.entityId === fromId)
      .map((t) =>
        CrmTasksService.updateCrmTask(companyId, t.id, { entityType: toType, entityId: toId })
      ),
    ...activities.data
      .filter((a) => a.entityType === fromType && a.entityId === fromId)
      .map((a) =>
        ActivitiesService.updateActivity(companyId, a.id, { entityType: toType, entityId: toId })
      ),
  ]);
}
