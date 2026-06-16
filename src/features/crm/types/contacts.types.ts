import type { CrmBaseFields } from "./crm.common.types";

export interface Contact extends CrmBaseFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  department?: string;
  accountName?: string;
  /** Commercial register (السجل التجاري) for future account linking */
  commercialRegister?: string;
  /** Tax number for billing (الرقم الضريبي) */
  taxNumber?: string;
  /** Address for billing invoices */
  billingAddress?: string;
  leadId?: string | null;
  assignedTo?: string | null;
}

export type CreateContactDTO = Omit<Contact, "id" | "createdAt" | "updatedAt">;
export type UpdateContactDTO = Partial<CreateContactDTO>;

export interface ContactFilters {
  search?: string;
  ownerId?: string;
}
