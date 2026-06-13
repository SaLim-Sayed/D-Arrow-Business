export interface CompanyProfile {
  id: string;
  name: string;
  nameAr?: string;
  commercialRegister: string;
  taxNumber?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdateCompanyProfileDTO = Partial<
  Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
>;
