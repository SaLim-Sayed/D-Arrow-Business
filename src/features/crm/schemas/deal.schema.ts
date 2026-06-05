import { z } from "zod";
import type { CreateDealDTO } from "../types/deals.types";

export const dealFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  contactId: z.string().nullable().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().min(1),
  stage: z.enum([
    "lead",
    "contacted",
    "qualified",
    "proposal_sent",
    "negotiation",
    "won",
    "lost",
  ]),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;

export function toCreateDealDTO(values: DealFormValues): CreateDealDTO {
  return {
    title: values.title.trim(),
    contactId: values.contactId ?? null,
    amount: values.amount,
    currency: values.currency || "USD",
    stage: values.stage,
    probability: values.probability ?? 0,
    expectedCloseDate: values.expectedCloseDate ?? null,
    assignedTo: values.assignedTo ?? null,
    leadId: null,
    ownerId: values.assignedTo ?? null,
    tags: [],
  };
}
