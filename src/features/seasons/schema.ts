import { z } from "zod";

export const CreateSeasonInputSchema = z
  .object({
    name: z
      .string({ message: "Name is required" })
      .trim()
      .min(1, { message: "Name is required" })
      .max(200),
    year: z.number().int().optional().default(0),
    startWeek: z.coerce.number().int().min(1).max(520).optional(),
    endWeek: z.coerce.number().int().min(1).max(520).optional(),
  })
  .refine((v) => !v.startWeek || !v.endWeek || v.startWeek <= v.endWeek, {
    message: "End week must be after start week",
    path: ["endWeek"],
  });

export const UpdateSeasonInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    year: z.number().int().optional(),
    startWeek: z.coerce.number().int().min(1).max(520).optional().nullable(),
    endWeek: z.coerce.number().int().min(1).max(520).optional().nullable(),
  })
  .refine((v) => !v.startWeek || !v.endWeek || v.startWeek <= v.endWeek, {
    message: "End week must be after start week",
    path: ["endWeek"],
  });

export const SeasonSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  year: z.number(),
  startWeek: z.number().nullable(),
  endWeek: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
});

export const SeasonsResponseSchema = z.array(SeasonSchema);

export type CreateSeasonInput = z.infer<typeof CreateSeasonInputSchema>;
export type UpdateSeasonInput = z.infer<typeof UpdateSeasonInputSchema>;
export type Season = z.infer<typeof SeasonSchema>;
