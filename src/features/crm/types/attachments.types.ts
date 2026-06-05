import type { CrmEntityType } from "./crm.common.types";

export interface CrmAttachment {
  id: string;
  entityType: CrmEntityType;
  entityId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

export type CreateAttachmentDTO = Omit<CrmAttachment, "id" | "createdAt">;

export interface AttachmentFilters {
  entityType?: CrmEntityType;
  entityId?: string;
}
