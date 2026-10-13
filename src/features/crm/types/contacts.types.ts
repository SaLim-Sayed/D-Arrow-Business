import type { CrmBaseFields } from "./crm.common.types";

export type ContactClassification =
  | "actual_client" // عميل فعلي
  | "potential_lead" // عميل محتمل
  | "callback"; // معاودة الاتصال

export type CustomerSatisfaction =
  | "satisfied" // راضي
  | "neutral" // محايد
  | "unsatisfied"; // غير راضي

export interface Contact extends CrmBaseFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  whatsappPhone?: string;
  jobTitle?: string;
  department?: string;
  accountName?: string;
  classification?: ContactClassification;
  satisfaction?: CustomerSatisfaction;
  satisfactionNotes?: string;
  interests?: string[];
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
  classification?: ContactClassification;
  satisfaction?: CustomerSatisfaction;
  assignedTo?: string;
}
