import { z } from "zod";

export const companyProfileSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  nameAr: z.string().optional(),
  commercialRegister: z
    .string()
    .min(5, "Commercial register must be at least 5 characters")
    .max(30, "Commercial register is too long"),
  taxNumber: z.string().optional(),
  legalName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  defaultCurrency: z.string().length(3, "Use ISO currency code"),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
