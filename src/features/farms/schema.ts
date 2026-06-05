import { z } from "zod";

export const CreateFarmInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
  location: z.string().trim().max(500).optional(),
  address: z.string().trim().max(1000).optional(),
  country: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  boundary: z.any().optional(),
  boundaryPolygon: z.any().optional(),
  boundary_polygon: z.any().optional(),
  areaSqm: z.number().min(0).optional().nullable(),
});

export const UpdateFarmInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  location: z.string().trim().max(500).optional(),
  address: z.string().trim().max(1000).optional(),
  country: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  boundary: z.any().optional(),
  boundaryPolygon: z.any().optional(),
  boundary_polygon: z.any().optional(),
  areaSqm: z.number().min(0).optional().nullable(),
});

export const FarmSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  location: z.string().nullable(),
  address: z.string().nullable(),
  country: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  boundary: z.any().nullable(),
  boundaryPolygon: z.any().nullable(),
  boundary_polygon: z.any().nullable().optional(),
  areaSqm: z.number().nullable(),
  createdAt: z.string(),
});

export const FarmsResponseSchema = z.array(FarmSchema);

export type CreateFarmInput = z.infer<typeof CreateFarmInputSchema>;
export type UpdateFarmInput = z.infer<typeof UpdateFarmInputSchema>;
export type Farm = z.infer<typeof FarmSchema>;
