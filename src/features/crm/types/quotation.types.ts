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
}

export interface QuotationData {
  quoteNumber: string;
  quoteDate: string;
  validityMonths: number;
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
