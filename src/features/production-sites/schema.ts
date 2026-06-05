import { z } from "zod";

export const CreateProductionSiteInputSchema = z.object({
  code: z
    .string({ message: "Site Code is required" })
    .trim()
    .min(1, { message: "Site Code is required" })
    .max(100),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const UpdateProductionSiteInputSchema = z.object({
  code: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const ProductionSiteSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

export const ProductionSitesResponseSchema = z.array(ProductionSiteSchema);

export type CreateProductionSiteInput = z.infer<typeof CreateProductionSiteInputSchema>;
export type UpdateProductionSiteInput = z.infer<typeof UpdateProductionSiteInputSchema>;
export type ProductionSite = z.infer<typeof ProductionSiteSchema>;
