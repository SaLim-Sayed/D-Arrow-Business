import type { CrmEntityType } from "./crm.common.types";

export interface CrmNote {
  id: string;
  content: string;
  entityType: CrmEntityType;
  entityId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteDTO = Omit<CrmNote, "id" | "createdAt" | "updatedAt">;
export type UpdateNoteDTO = Partial<Pick<CrmNote, "content" | "entityType" | "entityId">>;

export interface NoteFilters {
  entityType?: CrmEntityType;
  entityId?: string;
}
