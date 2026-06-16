import { z } from "zod";

export const productCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(),
});

export const productUnitSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g., Piece, Hour, Kg
  abbreviation: z.string().optional(), // e.g., pcs, hr, kg
});

export const productSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["goods", "service"]).default("goods"),
  name: z.string().min(2, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  categoryId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  taxRateId: z.string().nullable().optional(), // Links to BillingSettings Taxes
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductUnit = z.infer<typeof productUnitSchema>;
export type Product = z.infer<typeof productSchema>;
export type CreateProductDTO = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type UpdateProductDTO = Partial<CreateProductDTO>;
