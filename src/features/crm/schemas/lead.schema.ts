import { z } from "zod";
import type { CreateLeadDTO } from "../types/leads.types";

export const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z
    .enum(["new", "contacted", "qualified", "proposal_sent", "negotiation", "won", "lost"])
    .optional(),
  source: z
    .enum(["website", "referral", "social", "cold_call", "event", "other"])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export function toCreateLeadDTO(values: LeadFormValues): CreateLeadDTO {
  return {
    name: values.name.trim(),
    email: values.email?.trim() ?? "",
    phone: values.phone?.trim() ?? "",
    company: values.company?.trim() ?? "",
    status: values.status ?? "new",
    source: values.source ?? "other",
    priority: values.priority ?? "medium",
    assignedTo: values.assignedTo ?? null,
    notes: values.notes?.trim() ?? "",
    ownerId: null,
    tags: [],
  };
}
