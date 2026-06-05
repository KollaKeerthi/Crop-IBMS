import { z } from "zod";

export const CreateSubBlockInputSchema = z.object({
  blockId: z.string().uuid(),
  farmId: z.string().uuid(), // for access control
  name: z.string().trim().min(1).max(200),
  rows: z.number().int().positive().optional(),
  rowLengthM: z.number().positive().optional(),
  rowWidthM: z.number().positive().optional(),
  areaSqm: z.number().positive().optional(),
  suitableCrops: z.array(z.string().uuid()).optional(), // array of crop IDs
  boundary: z.any().optional(), // GeoJSON
  boundaryPolygon: z.any().optional(), // GeoJSON
  boundary_polygon: z.any().optional(), // GeoJSON
});

export const UpdateSubBlockInputSchema = CreateSubBlockInputSchema.omit({
  blockId: true,
  farmId: true,
}).partial();

export const SubBlockSchema = z.object({
  id: z.string().uuid(),
  blockId: z.string().uuid(),
  name: z.string(),
  rows: z.number().nullable(),
  rowLengthM: z.number().nullable(),
  rowWidthM: z.number().nullable(),
  areaSqm: z.number().nullable(),
  suitableCrops: z.array(z.string()).nullable(),
  boundary: z.any().nullable(),
  boundaryPolygon: z.any().nullable(),
  boundary_polygon: z.any().nullable().optional(),
  createdAt: z.string(),
});

export const SubBlocksResponseSchema = z.array(SubBlockSchema);

export type CreateSubBlockInput = z.infer<typeof CreateSubBlockInputSchema>;
export type UpdateSubBlockInput = z.infer<typeof UpdateSubBlockInputSchema>;
export type SubBlock = z.infer<typeof SubBlockSchema>;
