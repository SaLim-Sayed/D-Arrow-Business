import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  return value;
}

function normalizeOptionalUrl(value: unknown): string | undefined {
  const raw = emptyToUndefined(value);
  if (raw === undefined) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return undefined;
  }
}

const optionalUrlField = (invalidUrl: string) =>
  z.preprocess(
    normalizeOptionalUrl,
    z.string().url(invalidUrl).optional()
  );

export type BillingSettingsValidationMessages = {
  companyNameRequired: string;
  addressRequired: string;
  invalidEmail: string;
  invalidUrl: string;
  taxNameRequired: string;
  currencyRequired: string;
  sequenceNumberMin: string;
  sequencePaddingMin: string;
};

export function createBillingSettingsSchema(v: BillingSettingsValidationMessages) {
  const companyProfileSchema = z.object({
    name: z.string().min(2, v.companyNameRequired),
    logoUrl: optionalUrlField(v.invalidUrl),
    address: z.string().min(2, v.addressRequired),
    taxNumber: z.string().optional(),
    email: z
      .union([z.string().email(v.invalidEmail), z.literal("")])
      .optional(),
    phone: z.string().optional(),
    website: optionalUrlField(v.invalidUrl),
  });

  const currencySchema = z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string(),
    isDefault: z.boolean().default(false),
  });

  const taxSettingsSchema = z.object({
    id: z.string(),
    name: z.string().min(1, v.taxNameRequired),
    rate: z.preprocess(
      (val) => (Number.isFinite(Number(val)) ? Number(val) : 0),
      z.number().min(0).max(100)
    ),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
  });

  const paymentMethodSchema = z.object({
    id: z.string(),
    name: z.string(),
    details: z.string().optional(),
    isActive: z.boolean().default(true),
  });

  const documentSequenceSchema = z.object({
    prefix: z.string().default("DOC-"),
    nextNumber: z.preprocess(
      (val) => (Number.isFinite(Number(val)) && Number(val) >= 1 ? Number(val) : 1),
      z.number().int().min(1, v.sequenceNumberMin)
    ),
    suffix: z.string().optional(),
    padding: z.preprocess(
      (val) => (Number.isFinite(Number(val)) && Number(val) >= 1 ? Number(val) : 4),
      z.number().int().min(1, v.sequencePaddingMin)
    ),
  });

  const invoiceSequenceSchema = documentSequenceSchema.extend({
    prefix: z.string().default("INV-"),
  });

  return z.object({
    companyProfile: companyProfileSchema,
    currencies: z.array(currencySchema).min(1, v.currencyRequired),
    taxes: z.array(taxSettingsSchema),
    paymentMethods: z.array(paymentMethodSchema),
    invoiceSequence: invoiceSequenceSchema,
    quotationSequence: documentSequenceSchema
      .extend({ prefix: z.string().default("QUO-") })
      .optional(),
    estimateSequence: documentSequenceSchema
      .extend({ prefix: z.string().default("EST-") })
      .optional(),
    proposalSequence: documentSequenceSchema
      .extend({ prefix: z.string().default("PRP-") })
      .optional(),
  });
}

/** Default schema (English fallbacks) for non-React contexts */
export const billingSettingsSchema = createBillingSettingsSchema({
  companyNameRequired: "Company name is required",
  addressRequired: "Address is required",
  invalidEmail: "Invalid email address",
  invalidUrl: "Invalid URL",
  taxNameRequired: "Tax name is required",
  currencyRequired: "At least one currency is required",
  sequenceNumberMin: "Next number must be at least 1",
  sequencePaddingMin: "Padding must be at least 1",
});

export type CompanyProfile = z.infer<
  ReturnType<typeof createBillingSettingsSchema>
>["companyProfile"];
export type Currency = z.infer<
  ReturnType<typeof createBillingSettingsSchema>
>["currencies"][number];
export type TaxSettings = z.infer<
  ReturnType<typeof createBillingSettingsSchema>
>["taxes"][number];
export type PaymentMethod = z.infer<
  ReturnType<typeof createBillingSettingsSchema>
>["paymentMethods"][number];
export type BillingSettings = z.infer<
  ReturnType<typeof createBillingSettingsSchema>
>;
export type InvoiceSequence = BillingSettings["invoiceSequence"];
export type DocumentSequence = InvoiceSequence;
export type QuotationSequence = NonNullable<BillingSettings["quotationSequence"]>;
export type EstimateSequence = NonNullable<BillingSettings["estimateSequence"]>;
export type ProposalSequence = NonNullable<BillingSettings["proposalSequence"]>;
