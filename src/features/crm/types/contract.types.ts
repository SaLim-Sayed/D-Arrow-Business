import type { QuotationCompanyInfo } from "./quotation.types";

export interface ContractParty {
  name: string;
  commercialRegister?: string;
  taxNumber?: string;
  address?: string;
  representative?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
}

export interface ContractClauseBullet {
  id: string;
  text: string;
}

export interface ContractClause {
  id: string;
  title: string;
  /** Free-form body paragraphs (optional). Prefer bullets for PDF style. */
  body?: string;
  bullets: ContractClauseBullet[];
}

/** User-defined values interpolated into clauses via {{key}} */
export interface ContractDynamicField {
  id: string;
  key: string;
  label: string;
  value: string;
}

export interface ContractServiceSubtask {
  id: string;
  title: string;
  estimatedHours?: number;
  sequenceOrder?: number;
}

export interface ContractServiceItem {
  id: string;
  name: string;
  department: string;
  description?: string;
  estimatedHours?: number;
  durationDays?: number;
  selected: boolean;
  subtasks?: ContractServiceSubtask[];
}

export interface ContractFormDraft {
  title: string;
  contractNumber: string;
  contractType?: string;
  contractDateIso: string;
  preamble: string;
  provider: ContractParty;
  client: ContractParty;
  fields: ContractDynamicField[];
  clauses: ContractClause[];
  services?: ContractServiceItem[];
  convertedToTasks?: boolean;
  createdTaskIds?: string[];
  /** Shown in final provisions, e.g. "4" */
  pageCount: string;
  signatureDateIso: string;
  contactId?: string;
}

export type ContractStatus = "draft" | "final";

export interface SavedContract {
  id: string;
  title: string;
  status: ContractStatus;
  form: ContractFormDraft;
  contactId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus?: "pending" | "approved";
  approvedAt?: string | null;
  approvedBy?: string | null;
  convertedToTasks?: boolean;
  createdTaskIds?: string[];
}

export type CreateContractDTO = Omit<
  SavedContract,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateContractDTO = Partial<
  Omit<SavedContract, "id" | "createdAt" | "updatedAt" | "createdBy">
>;

export type ContractCompanyInfo = QuotationCompanyInfo;
