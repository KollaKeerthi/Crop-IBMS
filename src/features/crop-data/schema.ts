import { z } from "zod";

export const CreateCropDataInputSchema = z.object({
  farmId: z.string().uuid(),
  cropId: z.string().uuid().optional(),
  cropTypeId: z.string().uuid().optional(),
  varietyId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  block: z.string().optional(),
  fieldName: z.string().optional(),
  fieldCode: z.string().optional(),
  sexExpression: z.enum(["Male", "Female", "Bisexual"]).optional(),
  contractNo: z.string().optional(),
  headerNo: z.string().optional(),
  customerCode: z.string().optional(),
  contractRef: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateCropDataInput = z.infer<typeof CreateCropDataInputSchema>;

export const UpdateCropDataInputSchema = CreateCropDataInputSchema.partial().omit({ farmId: true });
export type UpdateCropDataInput = z.infer<typeof UpdateCropDataInputSchema>;

export const UpdateProgramInfoInputSchema = z.object({
  batchNo: z.string().optional(),
  plantingDate: z.string().optional(),
  malePlantCount: z.number().int().optional(),
  femalePlantCount: z.number().int().optional(),
  surfaceAreaSqm: z.number().optional(),
  maleDensity: z.number().optional(),
  femaleDensity: z.number().optional(),
  notes: z.string().optional(),
});
export type UpdateProgramInfoInput = z.infer<typeof UpdateProgramInfoInputSchema>;

export const UpdateNurseryInputSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  seedlingsCount: z.number().int().optional(),
  germinationRate: z.number().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});
export type UpdateNurseryInput = z.infer<typeof UpdateNurseryInputSchema>;

export const UpdateModuleInputSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});
export type UpdateModuleInput = z.infer<typeof UpdateModuleInputSchema>;

export const CropDataSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropId: z.string().uuid().nullable(),
  cropName: z.string().nullable(),
  varietyName: z.string().nullable(),
  seasonName: z.string().nullable(),
  block: z.string().nullable(),
  fieldName: z.string().nullable(),
  fieldCode: z.string().nullable(),
  sexExpression: z.string().nullable(),
  contractNo: z.string().nullable(),
  headerNo: z.string().nullable(),
  customerCode: z.string().nullable(),
  contractRef: z.string().nullable(),
  status: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type CropData = z.infer<typeof CropDataSchema>;

export const CropDataListSchema = z.array(CropDataSchema);
