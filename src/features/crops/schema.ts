import { z } from "zod";

export const CreateCropInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
  shortName: z.string().trim().max(50).optional(),
  scientificName: z.string().trim().max(200).optional(),
  family: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  color: z.string().trim().max(50).optional(),
  imageUrl: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
});

export const UpdateCropInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  shortName: z.string().trim().max(50).optional(),
  scientificName: z.string().trim().max(200).optional(),
  family: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  color: z.string().trim().max(50).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const CreateCropTypeInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(100),
});

export const CreateCropVarietyInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(100),
  code: z.string().trim().max(50).optional(),
});

export const CropTypeSchema = z.object({
  id: z.string().uuid(),
  cropId: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
});

export const CropVarietySchema = z.object({
  id: z.string().uuid(),
  cropId: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  createdAt: z.string(),
});

export const CropSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  shortName: z.string().nullable(),
  scientificName: z.string().nullable(),
  family: z.string().nullable(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  types: z.array(CropTypeSchema),
  varieties: z.array(CropVarietySchema),
});

export const CropsResponseSchema = z.array(CropSchema);

export type CreateCropInput = z.infer<typeof CreateCropInputSchema>;
export type UpdateCropInput = z.infer<typeof UpdateCropInputSchema>;
export type CreateCropTypeInput = z.infer<typeof CreateCropTypeInputSchema>;
export type CreateCropVarietyInput = z.infer<typeof CreateCropVarietyInputSchema>;
export type CropType = z.infer<typeof CropTypeSchema>;
export type CropVariety = z.infer<typeof CropVarietySchema>;
export type Crop = z.infer<typeof CropSchema>;
