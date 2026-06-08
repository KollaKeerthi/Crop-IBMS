import { z } from "zod";

export const PlantingStatusEnum = z.enum([
  "Planned",
  "Nursery",
  "Planted",
  "Growing",
  "Harvested",
  "Cancelled",
]);

export const PlantingMethodEnum = z.enum(["Direct", "Transplant", "Cutting", "Seed"]);

export const CreatePlantingInputSchema = z.object({
  farmId: z.string().uuid(),
  cropId: z.string().uuid().optional(),
  varietyId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  status: PlantingStatusEnum.default("Planned"),
  plantingMethod: PlantingMethodEnum.optional(),
  nurseryStartDate: z.string().date().optional(),
  fieldPlantingDate: z.string().date().optional(),
  firstHarvestDate: z.string().date().optional(),
  harvestEndDate: z.string().date().optional(),
  numRows: z.number().optional(),
  spacingM: z.number().optional(),
  areaSqm: z.number().optional(),
  blockMasterId: z.string().uuid().optional(),
  locationType: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  // ➕ Add these 4 configuration parameters for the date calculator engine
  daysInNursery: z.number().int().positive().optional(),
  daysToMaturity: z.number().int().positive().optional(),
  harvestWindowDays: z.number().int().positive().optional(),
  timeBetweenPlantingsDays: z.number().int().positive().optional(),
});

export const UpdatePlantingInputSchema = z.object({
  farmId: z.string().uuid(),
  cropId: z.string().uuid().optional().nullable(),
  varietyId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  status: PlantingStatusEnum.optional(),
  plantingMethod: PlantingMethodEnum.optional().nullable(),
  nurseryStartDate: z.string().date().optional().nullable(),
  fieldPlantingDate: z.string().date().optional().nullable(),
  firstHarvestDate: z.string().date().optional().nullable(),
  harvestEndDate: z.string().date().optional().nullable(),
  numRows: z.number().optional().nullable(),
  spacingM: z.number().optional().nullable(),
  areaSqm: z.number().optional().nullable(),
  blockMasterId: z.string().uuid().optional().nullable(),
  locationType: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  // ➕ Add them here as well (allowing nullable/optional changes on edit)
  daysInNursery: z.number().int().positive().optional().nullable(),
  daysToMaturity: z.number().int().positive().optional().nullable(),
  harvestWindowDays: z.number().int().positive().optional().nullable(),
  timeBetweenPlantingsDays: z.number().int().positive().optional().nullable(),
});

export const PlantingSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropId: z.string().uuid().nullable(),
  varietyId: z.string().uuid().nullable(),
  seasonId: z.string().uuid().nullable(),
  blockMasterId: z.string().uuid().nullable(),
  locationType: z.string().nullable(),
  status: PlantingStatusEnum,
  plantingMethod: PlantingMethodEnum.nullable(),
  nurseryStartDate: z.string().nullable(),
  fieldPlantingDate: z.string().nullable(),
  firstHarvestDate: z.string().nullable(),
  harvestEndDate: z.string().nullable(),
  numRows: z.number().nullable(),
  spacingM: z.number().nullable(),
  areaSqm: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  cropName: z.string().nullable(),
  varietyName: z.string().nullable(),
  seasonName: z.string().nullable(),
});

export const PlantingsResponseSchema = z.array(PlantingSchema);

export type PlantingStatus = z.infer<typeof PlantingStatusEnum>;
export type PlantingMethod = z.infer<typeof PlantingMethodEnum>;
export type CreatePlantingInput = z.infer<typeof CreatePlantingInputSchema>;
export type UpdatePlantingInput = z.infer<typeof UpdatePlantingInputSchema>;
export type Planting = z.infer<typeof PlantingSchema>;
