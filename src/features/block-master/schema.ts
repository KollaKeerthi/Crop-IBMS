import { z } from "zod";

export const SuitableCropInputSchema = z.object({
  cropId: z.string().uuid(),
  seasonIds: z.array(z.string().uuid()).optional(),
  rows: z.number().int().positive().optional(),
  plantsPerRow: z.number().positive().optional(),
});

export const CreateBlockMasterInputSchema = z.object({
  blockName: z
    .string({ message: "Block name is required" })
    .trim()
    .min(1, { message: "Block name is required" })
    .max(200),
  subBlockName: z.string().trim().max(200).optional(),
  areaSqm: z.number().positive().optional(),
  rows: z.number().int().positive().optional(),
  rowLengthM: z.number().positive().optional(),
  rowWidthM: z.number().positive().optional(),
  fieldId: z.string().uuid().optional(),
  greenhouseId: z.string().uuid().optional(),
  suitableCrops: z.array(SuitableCropInputSchema).optional(),
  useInPlanning: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdateBlockMasterInputSchema = z.object({
  blockName: z.string().trim().min(1).max(200).optional(),
  subBlockName: z.string().trim().max(200).optional().nullable(),
  areaSqm: z.number().positive().optional().nullable(),
  rows: z.number().int().positive().optional().nullable(),
  rowLengthM: z.number().positive().optional().nullable(),
  rowWidthM: z.number().positive().optional().nullable(),
  fieldId: z.string().uuid().optional().nullable(),
  greenhouseId: z.string().uuid().optional().nullable(),
  suitableCrops: z.array(SuitableCropInputSchema).optional().nullable(),
  useInPlanning: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const BlockMasterSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  blockName: z.string(),
  subBlockName: z.string().nullable(),
  areaSqm: z.number().nullable(),
  rows: z.number().nullable(),
  rowLengthM: z.number().nullable(),
  rowWidthM: z.number().nullable(),
  fieldId: z.string().uuid().nullable(),
  greenhouseId: z.string().uuid().nullable(),
  suitableCrops: z.array(z.union([SuitableCropInputSchema, z.string()])).nullable(),
  useInPlanning: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const BlockMasterResponseSchema = z.array(BlockMasterSchema);

export type CreateBlockMasterInput = z.infer<typeof CreateBlockMasterInputSchema>;
export type UpdateBlockMasterInput = z.infer<typeof UpdateBlockMasterInputSchema>;
export type BlockMaster = z.infer<typeof BlockMasterSchema>;
export type SuitableCropInput = z.infer<typeof SuitableCropInputSchema>;
