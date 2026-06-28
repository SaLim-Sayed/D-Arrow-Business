import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  taxNumber: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const currencySchema = z.object({
  code: z.string().length(3),
  symbol: z.string(),
  name: z.string(),
  isDefault: z.boolean().default(false),
});

export const taxSettingsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tax name is required"),
  rate: z.number().min(0).max(100),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g., Bank Transfer, PayPal, Cash
  details: z.string().optional(), // Instructions or account numbers
  isActive: z.boolean().default(true),
});

export const invoiceSequenceSchema = z.object({
  prefix: z.string().default('INV-'),
  nextNumber: z.number().int().min(1).default(1),
  suffix: z.string().optional(),
  padding: z.number().int().min(1).default(4), // e.g., padding 4 means 0001
});

export const billingSettingsSchema = z.object({
  companyProfile: companyProfileSchema,
  currencies: z.array(currencySchema).min(1, 'At least one currency is required'),
  taxes: z.array(taxSettingsSchema),
  paymentMethods: z.array(paymentMethodSchema),
  invoiceSequence: invoiceSequenceSchema,
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type TaxSettings = z.infer<typeof taxSettingsSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type InvoiceSequence = z.infer<typeof invoiceSequenceSchema>;
export type BillingSettings = z.infer<typeof billingSettingsSchema>;
