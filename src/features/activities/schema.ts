import { z } from "zod";

export const CreateActivityInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(100).optional(),
  code: z.string().trim().max(20).optional(),
  displayOrder: z.number().int().min(0).default(0),
  maxSimultaneous: z.number().int().min(1).default(1),
});

export const UpdateActivityInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  code: z.string().trim().max(20).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  maxSimultaneous: z.number().int().min(1).optional(),
});

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  code: z.string().nullable(),
  displayOrder: z.number(),
  maxSimultaneous: z.number(),
  createdAt: z.string(),
});

export const ActivitiesResponseSchema = z.array(ActivitySchema);

export type CreateActivityInput = z.infer<typeof CreateActivityInputSchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivityInputSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
