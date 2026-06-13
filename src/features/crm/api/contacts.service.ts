import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { Contact, CreateContactDTO, UpdateContactDTO } from "../types/contacts.types";

const base = createCrmCollectionService<Contact, CreateContactDTO, UpdateContactDTO>(
  CRM_COLLECTIONS.contacts,
  "ContactsService",
  {
    ownerId: null,
    tags: [],
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    commercialRegister: "",
    assignedTo: null,
  }
);

export const ContactsService = {
  getContacts: base.getAll,
  getContactById: base.getById,
  createContact: base.create,
  updateContact: base.update,
  deleteContact: base.delete,
};
