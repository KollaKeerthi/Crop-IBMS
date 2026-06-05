import { z } from "zod";

export const VariabilityKind = z.enum(["Fixed", "Flexible"]);
export type VariabilityKind = z.infer<typeof VariabilityKind>;

export const CreateVariabilityInputSchema = z.object({
  farmId: z.string().uuid().nullable().optional(),
  productionTypeId: z.string().uuid(),
  variability: VariabilityKind,
});

export const UpdateVariabilityInputSchema = z.object({
  productionTypeId: z.string().uuid().optional(),
  variability: VariabilityKind.optional(),
});

export const VariabilitySchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid().nullable(),
  productionTypeId: z.string().uuid(),
  productionTypeName: z.string().nullable(),
  variability: VariabilityKind,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const VariabilityListResponseSchema = z.array(VariabilitySchema);

export type CreateVariabilityInput = z.infer<typeof CreateVariabilityInputSchema>;
export type UpdateVariabilityInput = z.infer<typeof UpdateVariabilityInputSchema>;
export type Variability = z.infer<typeof VariabilitySchema>;
