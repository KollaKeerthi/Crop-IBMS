import { z } from "zod";

export const LeadTimeType = z.enum(["Reservation", "Contract"]);

export const CreateActiveTimeInputSchema = z.object({
  leadTimeRefNumber: z.string().trim().max(50).optional(),
  cropId: z.string().uuid().optional(),
  varietyId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  productionTypeId: z.string().uuid().optional(),
  leadTimeType: LeadTimeType.optional(),
  materialArrival: z.number().int().min(0).max(52).optional(),
  sowingMale: z.number().int().min(1).max(52).optional(),
  sowingFemale: z.number().int().min(1).max(52).optional(),
  plantingMale: z.number().int().min(1).max(52).optional(),
  plantingFemale: z.number().int().min(1).max(52).optional(),
  pollinationStart: z.number().int().min(1).max(52).optional(),
  pollinationEnd: z.number().int().min(1).max(52).optional(),
  harvestingStart: z.number().int().min(1).max(52).optional(),
  harvestingEnd: z.number().int().min(1).max(52).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdateActiveTimeInputSchema = z.object({
  leadTimeRefNumber: z.string().trim().max(50).optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  varietyId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  productionTypeId: z.string().uuid().optional().nullable(),
  leadTimeType: LeadTimeType.optional().nullable(),
  materialArrival: z.number().int().min(0).max(52).optional().nullable(),
  sowingMale: z.number().int().min(1).max(52).optional().nullable(),
  sowingFemale: z.number().int().min(1).max(52).optional().nullable(),
  plantingMale: z.number().int().min(1).max(52).optional().nullable(),
  plantingFemale: z.number().int().min(1).max(52).optional().nullable(),
  pollinationStart: z.number().int().min(1).max(52).optional().nullable(),
  pollinationEnd: z.number().int().min(1).max(52).optional().nullable(),
  harvestingStart: z.number().int().min(1).max(52).optional().nullable(),
  harvestingEnd: z.number().int().min(1).max(52).optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const AddActivityToActiveTimeSchema = z.object({
  activityId: z.string().uuid(),
  weekNumber: z.number().int().min(0).max(52),
  dayOffset: z.number().int().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const ActiveTimeActivitySchema = z.object({
  id: z.string().uuid(),
  activeTimeId: z.string().uuid(),
  activityId: z.string().uuid().nullable(),
  weekNumber: z.number().nullable(),
  dayOffset: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const ActiveTimeSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  leadTimeRefNumber: z.string().nullable(),
  cropId: z.string().uuid().nullable(),
  varietyId: z.string().uuid().nullable(),
  seasonId: z.string().uuid().nullable(),
  productionTypeId: z.string().uuid().nullable(),
  leadTimeType: z.string().nullable(),
  materialArrival: z.number().int().nullable(),
  sowingMale: z.number().int().nullable(),
  sowingFemale: z.number().int().nullable(),
  plantingMale: z.number().int().nullable(),
  plantingFemale: z.number().int().nullable(),
  pollinationStart: z.number().int().nullable(),
  pollinationEnd: z.number().int().nullable(),
  harvestingStart: z.number().int().nullable(),
  harvestingEnd: z.number().int().nullable(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  cropName: z.string().nullable(),
  varietyName: z.string().nullable(),
  seasonName: z.string().nullable(),
  productionTypeName: z.string().nullable(),
  activities: z.array(ActiveTimeActivitySchema),
});

export const ActiveTimesResponseSchema = z.array(ActiveTimeSchema);

export type CreateActiveTimeInput = z.infer<typeof CreateActiveTimeInputSchema>;
export type UpdateActiveTimeInput = z.infer<typeof UpdateActiveTimeInputSchema>;
export type LeadTimeType = z.infer<typeof LeadTimeType>;
export type AddActivityToActiveTimeInput = z.infer<typeof AddActivityToActiveTimeSchema>;
export type ActiveTimeActivity = z.infer<typeof ActiveTimeActivitySchema>;
export type ActiveTime = z.infer<typeof ActiveTimeSchema>;
