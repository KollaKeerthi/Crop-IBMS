import { z } from "zod";

const NAME_MAX = 120;
const DESCRIPTION_MAX = 2_000;

const UuidSchema = z.string().uuid({ message: "Invalid id" });

export const ThingNameSchema = z
  .string({ message: "Name is required" })
  .trim()
  .min(1, { message: "Name is required" })
  .max(NAME_MAX, { message: `Name must be ${NAME_MAX} characters or fewer` });

export const CreateThingInputSchema = z.object({
  name: ThingNameSchema,
  description: z
    .string()
    .max(DESCRIPTION_MAX, {
      message: `Description must be ${DESCRIPTION_MAX} characters or fewer`,
    })
    .nullable()
    .optional(),
});

export const UpdateThingInputSchema = z.object({
  name: ThingNameSchema.optional(),
  description: z.string().max(DESCRIPTION_MAX).nullable().optional(),
});

export const ThingSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ThingsResponseSchema = z.array(ThingSchema);

export type CreateThingInput = z.infer<typeof CreateThingInputSchema>;
export type UpdateThingInput = z.infer<typeof UpdateThingInputSchema>;
export type Thing = z.infer<typeof ThingSchema>;
