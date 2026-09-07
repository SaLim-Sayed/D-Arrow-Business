import { z } from "zod";

export const costCenterSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "رمز مركز التكلفة مطلوب"),
  name: z.string().min(1, "اسم مركز التكلفة مطلوب"),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CostCenter = z.infer<typeof costCenterSchema>;
export type CreateCostCenterDTO = Omit<CostCenter, "id" | "createdAt" | "updatedAt">;
export type UpdateCostCenterDTO = Partial<CreateCostCenterDTO>;
