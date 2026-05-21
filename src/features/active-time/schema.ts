import { z } from "zod";

export const CreateActiveTimeInputSchema = z.object({
  cropId: z.string().uuid().optional(),
  varietyId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  productionTypeId: z.string().uuid().optional(),
  leadTimeType: z.string().trim().max(200).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdateActiveTimeInputSchema = z.object({
  cropId: z.string().uuid().optional().nullable(),
  varietyId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  productionTypeId: z.string().uuid().optional().nullable(),
  leadTimeType: z.string().trim().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const AddActivityToActiveTimeSchema = z.object({
  activityId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(52),
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
  cropId: z.string().uuid().nullable(),
  varietyId: z.string().uuid().nullable(),
  seasonId: z.string().uuid().nullable(),
  productionTypeId: z.string().uuid().nullable(),
  leadTimeType: z.string().nullable(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  cropName: z.string().nullable(),
  varietyName: z.string().nullable(),
  seasonName: z.string().nullable(),
  activities: z.array(ActiveTimeActivitySchema),
});

export const ActiveTimesResponseSchema = z.array(ActiveTimeSchema);

export type CreateActiveTimeInput = z.infer<typeof CreateActiveTimeInputSchema>;
export type UpdateActiveTimeInput = z.infer<typeof UpdateActiveTimeInputSchema>;
export type AddActivityToActiveTimeInput = z.infer<typeof AddActivityToActiveTimeSchema>;
export type ActiveTimeActivity = z.infer<typeof ActiveTimeActivitySchema>;
export type ActiveTime = z.infer<typeof ActiveTimeSchema>;
