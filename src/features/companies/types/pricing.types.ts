export type PriceStatus = "active" | "inactive";

export interface ProductPrice {
  id: string;
  name: string;
  nameAr?: string;
  sku?: string;
  description?: string;
  unitPrice: number;
  currency: string;
  taxRate?: number;
  status: PriceStatus;
  commercialRegisterRef?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductPriceDTO = Omit<
  ProductPrice,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateProductPriceDTO = Partial<CreateProductPriceDTO>;
