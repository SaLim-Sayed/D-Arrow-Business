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
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  accountName: z.string().optional(),
  commercialRegister: z
    .string()
    .max(30, "Commercial register is too long")
    .optional()
    .refine(
      (v) => !v?.trim() || v.trim().length >= 5,
      "Commercial register must be at least 5 characters"
    ),
  assignedTo: z.string().nullable().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export function toCreateContactDTO(values: ContactFormValues): CreateContactDTO {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName?.trim() ?? "",
    email: values.email?.trim() ?? "",
    phone: values.phone?.trim() ?? "",
    jobTitle: values.jobTitle?.trim(),
    department: values.department?.trim(),
    accountName: values.accountName?.trim(),
    commercialRegister: values.commercialRegister?.trim() || undefined,
    assignedTo: values.assignedTo ?? null,
    leadId: null,
    ownerId: values.assignedTo ?? null,
    tags: [],
  };
}
