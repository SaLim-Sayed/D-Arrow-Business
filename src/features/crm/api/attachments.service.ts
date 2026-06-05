import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { CrmAttachment, CreateAttachmentDTO } from "../types/attachments.types";

const base = createCrmCollectionService<
  CrmAttachment,
  CreateAttachmentDTO,
  Partial<CreateAttachmentDTO>
>(CRM_COLLECTIONS.attachments, "AttachmentsService", {
  mimeType: "application/octet-stream",
  sizeBytes: 0,
});

export const AttachmentsService = {
  getAttachments: base.getAll,
  getAttachmentById: base.getById,
  createAttachment: base.create,
  updateAttachment: base.update,
  deleteAttachment: base.delete,
};
