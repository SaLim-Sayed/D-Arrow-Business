import type { CrmBaseFields } from "./crm.common.types";

export interface Contact extends CrmBaseFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  department?: string;
  accountName?: string;
  leadId?: string | null;
  assignedTo?: string | null;
}

export type CreateContactDTO = Omit<Contact, "id" | "createdAt" | "updatedAt">;
export type UpdateContactDTO = Partial<CreateContactDTO>;

export interface ContactFilters {
  search?: string;
  ownerId?: string;
}
