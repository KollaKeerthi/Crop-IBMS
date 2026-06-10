import { z } from "zod";

export const CreateStakeholderInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
  description: z.string().trim().max(2000).optional(),
});

export const UpdateStakeholderInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const StakeholderSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

export const StakeholderResponseSchema = z.array(StakeholderSchema);

export type CreateStakeholderInput = z.infer<typeof CreateStakeholderInputSchema>;
export type UpdateStakeholderInput = z.infer<typeof UpdateStakeholderInputSchema>;
export type Stakeholder = z.infer<typeof StakeholderSchema>;
