import { z } from "zod";

export const CreateSeasonInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200),
  year: z
    .number({ message: "Year is required" })
    .int()
    .min(1900)
    .max(2100),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const UpdateSeasonInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  startDate: z.string().date().optional().nullable(),
  endDate: z.string().date().optional().nullable(),
});

export const SeasonSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  year: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
});

export const SeasonsResponseSchema = z.array(SeasonSchema);

export type CreateSeasonInput = z.infer<typeof CreateSeasonInputSchema>;
export type UpdateSeasonInput = z.infer<typeof UpdateSeasonInputSchema>;
export type Season = z.infer<typeof SeasonSchema>;
