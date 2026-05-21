import { z } from "zod";

export const ASSET_TYPES = ["well", "sensor", "gate", "storage", "road", "fence", "water_valve", "barn", "other"] as const;
export const GEOMETRY_TYPES = ["Point", "Polygon", "LineString"] as const;

export const CreateFarmAssetInputSchema = z.object({
  farmId: z.string().uuid(),
  assetType: z.enum(ASSET_TYPES),
  name: z.string().trim().max(200).optional(),
  geometryType: z.enum(GEOMETRY_TYPES),
  coordinates: z.any(), // GeoJSON coordinates array
  properties: z.record(z.unknown()).optional(),
});

export const UpdateFarmAssetInputSchema = z.object({
  assetType: z.enum(ASSET_TYPES).optional(),
  name: z.string().trim().max(200).optional().nullable(),
  geometryType: z.enum(GEOMETRY_TYPES).optional(),
  coordinates: z.any().optional(),
  properties: z.record(z.unknown()).optional().nullable(),
});

export const FarmAssetSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  assetType: z.string(),
  name: z.string().nullable(),
  geometryType: z.enum(GEOMETRY_TYPES),
  coordinates: z.any(),
  properties: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
});

export const FarmAssetsResponseSchema = z.array(FarmAssetSchema);

export type CreateFarmAssetInput = z.infer<typeof CreateFarmAssetInputSchema>;
export type UpdateFarmAssetInput = z.infer<typeof UpdateFarmAssetInputSchema>;
export type FarmAsset = z.infer<typeof FarmAssetSchema>;
