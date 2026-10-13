import { z } from "zod";
import type { CreateContactDTO } from "../types/contacts.types";

export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Invalid email"),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  whatsappPhone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  accountName: z.string().optional(),
  classification: z.enum(["actual_client", "potential_lead", "callback"]).optional(),
  satisfaction: z.enum(["satisfied", "neutral", "unsatisfied"]).optional(),
  satisfactionNotes: z.string().optional(),
  interests: z.array(z.string()).optional(),
  commercialRegister: z
    .string()
    .max(30, "Commercial register is too long")
    .optional()
    .refine(
      (v) => !v?.trim() || v.trim().length >= 5,
      "Commercial register must be at least 5 characters"
    ),
  assignedTo: z.string().nullable().optional(),
  taxNumber: z.string().optional(),
  billingAddress: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export function toCreateContactDTO(values: ContactFormValues): CreateContactDTO {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName?.trim() ?? "",
    email: values.email?.trim() ?? "",
    phone: values.phone?.trim() ?? "",
    secondaryPhone: values.secondaryPhone?.trim() || undefined,
    whatsappPhone: values.whatsappPhone?.trim() || undefined,
    jobTitle: values.jobTitle?.trim(),
    department: values.department?.trim(),
    accountName: values.accountName?.trim(),
    classification: values.classification || "actual_client",
    satisfaction: values.satisfaction || "satisfied",
    satisfactionNotes: values.satisfactionNotes?.trim() || undefined,
    interests: values.interests ?? [],
    commercialRegister: values.commercialRegister?.trim() || undefined,
    taxNumber: values.taxNumber?.trim() || undefined,
    billingAddress: values.billingAddress?.trim() || undefined,
    assignedTo: values.assignedTo ?? null,
    leadId: null,
    ownerId: values.assignedTo ?? null,
    tags: values.interests ?? [],
  };
}
