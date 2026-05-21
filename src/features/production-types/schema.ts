import { z } from "zod";

export const CreateProductionTypeInputSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(100),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const UpdateProductionTypeInputSchema = z.object({
  code: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const ProductionTypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

export const ProductionTypesResponseSchema = z.array(ProductionTypeSchema);

export type CreateProductionTypeInput = z.infer<typeof CreateProductionTypeInputSchema>;
export type UpdateProductionTypeInput = z.infer<typeof UpdateProductionTypeInputSchema>;
export type ProductionType = z.infer<typeof ProductionTypeSchema>;
