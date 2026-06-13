import { z } from "zod";

export const pricingFormSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  nameAr: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  unitPrice: z.number().min(0, "Price must be positive"),
  currency: z.string().length(3, "Use ISO currency code"),
  taxRate: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "inactive"]),
});

export type PricingFormValues = z.infer<typeof pricingFormSchema>;
