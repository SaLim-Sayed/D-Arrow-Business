import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { CrmNote, CreateNoteDTO, UpdateNoteDTO } from "../types/notes.types";

const base = createCrmCollectionService<CrmNote, CreateNoteDTO, UpdateNoteDTO>(
  CRM_COLLECTIONS.notes,
  "NotesService",
  {
    content: "",
    entityType: "lead",
    entityId: "",
    authorId: "",
  }
);

export const NotesService = {
  getNotes: base.getAll,
  getNoteById: base.getById,
  createNote: base.create,
  updateNote: base.update,
  deleteNote: base.delete,
};
