export type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "won";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  assignedTo: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateLeadDTO = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadDTO = Partial<CreateLeadDTO>;
