import { z } from "zod";

const weekNumber = z.coerce
  .number()
  .int()
  .min(1, "Week must be between 1 and 52")
  .max(52, "Week must be between 1 and 52");

export const CreateDensityMasterInputSchema = z
  .object({
    cropId: z.string().uuid({ message: "Select a crop" }).optional(),
    cropTypeId: z.string().uuid().optional(),
    productionTypeId: z.string().uuid().optional(),
    stakeholderId: z.string().uuid().optional(),
    year: z.number().int().min(1900).max(2200).optional(),
    maleDensity: z.number().positive().optional(),
    femaleDensity: z.number().positive().optional(),
    validFrom: weekNumber.default(1),
    validTo: weekNumber.default(52),
  })
  .refine((v) => v.validFrom <= v.validTo, {
    message: "Valid From must be ≤ Valid To",
    path: ["validTo"],
  });

export const UpdateDensityMasterInputSchema = z.object({
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  productionTypeId: z.string().uuid().optional().nullable(),
  stakeholderId: z.string().uuid().optional().nullable(),
  year: z.number().int().min(1900).max(2200).optional().nullable(),
  maleDensity: z.number().positive().optional().nullable(),
  femaleDensity: z.number().positive().optional().nullable(),
  validFrom: weekNumber.optional(),
  validTo: weekNumber.optional(),
});

export const DensityMasterSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropId: z.string().uuid().nullable(),
  cropTypeId: z.string().uuid().nullable(),
  productionTypeId: z.string().uuid().nullable(),
  stakeholderId: z.string().uuid().nullable(),
  year: z.number().int().nullable(),
  maleDensity: z.number().nullable(),
  femaleDensity: z.number().nullable(),
  validFrom: z.number().int(),
  validTo: z.number().int(),
  createdAt: z.string(),
});

export const DensityMasterResponseSchema = z.array(DensityMasterSchema);

export type CreateDensityMasterInput = z.infer<typeof CreateDensityMasterInputSchema>;
export type UpdateDensityMasterInput = z.infer<typeof UpdateDensityMasterInputSchema>;
export type DensityMaster = z.infer<typeof DensityMasterSchema>;
