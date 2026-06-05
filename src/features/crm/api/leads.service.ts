import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { Lead, CreateLeadDTO, UpdateLeadDTO } from "../types/leads.types";

const base = createCrmCollectionService<Lead, CreateLeadDTO, UpdateLeadDTO>(
  CRM_COLLECTIONS.leads,
  "LeadsService",
  {
    status: "new",
    priority: "medium",
    source: "other",
    assignedTo: null,
    ownerId: null,
    notes: "",
    tags: [],
    email: "",
    phone: "",
    company: "",
  }
);

export const LeadsService = {
  getLeads: base.getAll,
  getLeadById: base.getById,
  createLead: base.create,
  updateLead: base.update,
  deleteLead: base.delete,
};
