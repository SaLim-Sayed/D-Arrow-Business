export interface QuotationLineItem {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  /** Bullet points shown in the description column */
  descriptionLines?: string[];
  quantity: number;
  unitPrice: number;
  optional?: boolean;
}

export interface QuotationCompanyInfo {
  nameAr: string;
  nameEn: string;
  commercialRegister: string;
  taxNumber: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  email: string;
  website: string;
  districtAr?: string;
  districtEn?: string;
}

export interface QuotationClientInfo {
  name: string;
  commercialRegister?: string;
  recipientTitle?: QuotationRecipientTitle;
}

export type QuotationRecipientTitle = "mr" | "mrs" | "professor";

export type QuotationValidityUnit = "day" | "month";

export interface QuotationData {
  quoteNumber: string;
  quoteDate: string;
  validityDuration: number;
  validityUnit: QuotationValidityUnit;
  company: QuotationCompanyInfo;
  client: QuotationClientInfo;
  items: QuotationLineItem[];
  currency: string;
  vatRate: number;
  pricesIncludeVat: boolean;
  notes?: string;
}

export interface QuotationTotals {
  subtotal: number;
  vatAmount: number;
  total: number;
}

/** One editable line in the quotation builder */
export interface QuotationDraftLine {
  id: string;
  /** Catalog/template id: priceId | "base" | "addon-N" | null for custom */
  sourceId: string | null;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  unitPrice: number;
  quantity: number;
}

/** Serializable quotation form state for persistence */
export interface QuotationFormDraft {
  quoteNumber: string;
  quoteDateIso: string;
  validityDuration: number;
  validityUnit: QuotationValidityUnit;
  /** @deprecated pre-unit drafts stored months here; read-only for migration */
  validityMonths?: number;
  clientName: string;
  clientCr: string;
  recipientTitle: QuotationRecipientTitle;
  selectedContactId: string;
  lines: QuotationDraftLine[];
  notesByLocale: Partial<Record<"ar" | "en", string>>;
  vatRate: number;
  pricesIncludeVat: boolean;
}

/** Legacy checkbox-based draft shape (pre line-items UI) */
export interface LegacyQuotationFormDraft {
  quoteNumber: string;
  quoteDateIso: string;
  validityMonths: number;
  clientName: string;
  clientCr: string;
  recipientTitle?: QuotationRecipientTitle;
  selectedContactId: string;
  includeBase: boolean;
  basePrice: number;
  selectedPriceIds: string[];
  selectedAddonIds: string[];
  addonPrices: Record<string, number>;
  itemDescriptions: Record<string, Partial<Record<"ar" | "en", string>>>;
  notesByLocale: Partial<Record<"ar" | "en", string>>;
  vatRate: number;
  pricesIncludeVat: boolean;
}

export type QuotationStatus = "draft" | "sent";

export interface SavedQuotation {
  id: string;
  title: string;
  status: QuotationStatus;
  form: QuotationFormDraft;
  total: number;
  currency: string;
  contactId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateQuotationDTO = Omit<
  SavedQuotation,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateQuotationDTO = Partial<
  Omit<SavedQuotation, "id" | "createdAt" | "updatedAt" | "createdBy">
>;
