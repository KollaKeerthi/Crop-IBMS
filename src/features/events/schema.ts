import { z } from "zod";

export const RecurrenceTypeEnum = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);

export const CreateEventInputSchema = z.object({
  farmId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().default(true),
  recurrenceType: RecurrenceTypeEnum.default("none"),
  color: z.string().optional(),
});

export const UpdateEventInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  allDay: z.boolean().optional(),
  recurrenceType: RecurrenceTypeEnum.optional(),
  color: z.string().optional().nullable(),
});

export const EventSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  allDay: z.boolean(),
  recurrenceType: RecurrenceTypeEnum,
  color: z.string().nullable(),
  createdAt: z.string(),
});

export const EventsResponseSchema = z.array(EventSchema);

export type RecurrenceType = z.infer<typeof RecurrenceTypeEnum>;
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventInputSchema>;
export type Event = z.infer<typeof EventSchema>;
