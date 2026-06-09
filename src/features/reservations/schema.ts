import { z } from "zod";

export const ReservationTypeEnum = z.enum(["normal", "empty"]);
export const ReservationStatusEnum = z.enum(["new", "active", "completed"]);

export const CreateReservationInputSchema = z.object({
  type: ReservationTypeEnum.default("normal"),
  status: ReservationStatusEnum.default("new"),
  productionTypeId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  activeTimeId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  pollinationStartWeek: z.number().int().min(1).max(52).optional().nullable(),
  materialArrivalWeek: z.number().int().min(1).max(52).optional().nullable(),
  plantingWeek: z.number().int().min(1).max(52).optional().nullable(),
  endWeek: z.number().int().min(1).max(53).optional().nullable(),
  startWeek: z.number().int().min(1).max(52).optional().nullable(),
  noOfPlantsFemale: z.number().positive().optional().nullable(),
  plantsPerM2: z.number().positive().optional().nullable(),
  surfaceFemale: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean().default(false),
  totalSurface: z.number().positive().optional().nullable(),
  reservationRef: z.string().trim().max(200).optional().nullable(),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export const UpdateReservationInputSchema = z.object({
  type: ReservationTypeEnum.optional(),
  status: ReservationStatusEnum.optional(),
  productionTypeId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropTypeId: z.string().uuid().optional().nullable(),
  blockId: z.string().uuid().optional().nullable(),
  activeTimeId: z.string().uuid().optional().nullable(),
  seasonId: z.string().uuid().optional().nullable(),
  year: z.number().int().min(2000).max(2100).optional(),
  pollinationStartWeek: z.number().int().min(1).max(52).optional().nullable(),
  materialArrivalWeek: z.number().int().min(1).max(52).optional().nullable(),
  plantingWeek: z.number().int().min(1).max(52).optional().nullable(),
  endWeek: z.number().int().min(1).max(53).optional().nullable(),
  startWeek: z.number().int().min(1).max(52).optional().nullable(),
  noOfPlantsFemale: z.number().positive().optional().nullable(),
  plantsPerM2: z.number().positive().optional().nullable(),
  surfaceFemale: z.number().positive().optional().nullable(),
  surfaceMale: z.number().nonnegative().optional().nullable(),
  mfSameBlock: z.boolean().optional(),
  totalSurface: z.number().positive().optional().nullable(),
  reservationRef: z.string().trim().max(200).optional().nullable(),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  type: ReservationTypeEnum,
  status: ReservationStatusEnum,
  productionTypeId: z.string().uuid().nullable(),
  cropId: z.string().uuid().nullable(),
  cropTypeId: z.string().uuid().nullable(),
  blockId: z.string().uuid().nullable(),
  activeTimeId: z.string().uuid().nullable(),
  seasonId: z.string().uuid().nullable(),
  year: z.number().int(),
  pollinationStartWeek: z.number().int().nullable(),
  materialArrivalWeek: z.number().int().nullable(),
  plantingWeek: z.number().int().nullable(),
  endWeek: z.number().int().nullable(),
  startWeek: z.number().int().nullable(),
  noOfPlantsFemale: z.number().nullable(),
  plantsPerM2: z.number().nullable(),
  surfaceFemale: z.number().nullable(),
  surfaceMale: z.number().nullable(),
  mfSameBlock: z.boolean(),
  totalSurface: z.number().nullable(),
  reservationRef: z.string().nullable(),
  reason: z.string().nullable(),
  // joined display names
  cropName: z.string().nullable(),
  cropTypeName: z.string().nullable(),
  productionTypeName: z.string().nullable(),
  blockName: z.string().nullable(),
  seasonName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReservationsResponseSchema = z.array(ReservationSchema);

export type ReservationType = z.infer<typeof ReservationTypeEnum>;
export type ReservationStatus = z.infer<typeof ReservationStatusEnum>;
export type CreateReservationInput = z.infer<typeof CreateReservationInputSchema>;
export type UpdateReservationInput = z.infer<typeof UpdateReservationInputSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
