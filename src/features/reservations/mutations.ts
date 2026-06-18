import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import type { CreateReservationInput, UpdateReservationInput, Reservation } from "./schema";
import { getReservationById } from "./queries";

export async function insertReservation(
  farmId: string,
  input: CreateReservationInput
): Promise<Reservation | null> {
  const [row] = await db
    .insert(reservations)
    .values({
      farmId,
      type: input.type ?? "normal",
      status: input.status ?? "new",
      productionTypeId: input.productionTypeId ?? null,
      cropId: input.cropId ?? null,
      cropTypeId: input.cropTypeId ?? null,
      stakeholderId: input.stakeholderId ?? null,
      blockId: input.blockId ?? null,
      activeTimeId: input.activeTimeId ?? null,
      seasonId: input.seasonId ?? null,
      year: input.year,
      pollinationStartWeek: input.pollinationStartWeek ?? null,
      materialArrivalWeek: input.materialArrivalWeek ?? null,
      plantingWeek: input.plantingWeek ?? null,
      endWeek: input.endWeek ?? null,
      startWeek: input.startWeek ?? null,
      noOfPlantsFemale: input.noOfPlantsFemale ?? null,
      plantsPerM2: input.plantsPerM2 ?? null,
      surfaceFemale: input.surfaceFemale ?? null,
      surfaceMale: input.surfaceMale ?? null,
      mfSameBlock: input.mfSameBlock ?? false,
      totalSurface: input.totalSurface ?? null,
      reservationRef: input.reservationRef ?? null,
      reason: input.reason ?? null,
    })
    .returning();

  if (!row) return null;
  return getReservationById(row.id, farmId);
}

export async function updateReservation(
  id: string,
  farmId: string,
  input: UpdateReservationInput
): Promise<Reservation | null> {
  await db
    .update(reservations)
    .set({
      ...(input.type !== undefined && { type: input.type }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.productionTypeId !== undefined && { productionTypeId: input.productionTypeId }),
      ...(input.cropId !== undefined && { cropId: input.cropId }),
      ...(input.cropTypeId !== undefined && { cropTypeId: input.cropTypeId }),
      ...(input.stakeholderId !== undefined && { stakeholderId: input.stakeholderId }),
      ...(input.blockId !== undefined && { blockId: input.blockId }),
      ...(input.activeTimeId !== undefined && { activeTimeId: input.activeTimeId }),
      ...(input.seasonId !== undefined && { seasonId: input.seasonId }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.pollinationStartWeek !== undefined && {
        pollinationStartWeek: input.pollinationStartWeek,
      }),
      ...(input.materialArrivalWeek !== undefined && {
        materialArrivalWeek: input.materialArrivalWeek,
      }),
      ...(input.plantingWeek !== undefined && { plantingWeek: input.plantingWeek }),
      ...(input.endWeek !== undefined && { endWeek: input.endWeek }),
      ...(input.startWeek !== undefined && { startWeek: input.startWeek }),
      ...(input.noOfPlantsFemale !== undefined && { noOfPlantsFemale: input.noOfPlantsFemale }),
      ...(input.plantsPerM2 !== undefined && { plantsPerM2: input.plantsPerM2 }),
      ...(input.surfaceFemale !== undefined && { surfaceFemale: input.surfaceFemale }),
      ...(input.surfaceMale !== undefined && { surfaceMale: input.surfaceMale }),
      ...(input.mfSameBlock !== undefined && { mfSameBlock: input.mfSameBlock }),
      ...(input.totalSurface !== undefined && { totalSurface: input.totalSurface }),
      ...(input.reservationRef !== undefined && { reservationRef: input.reservationRef }),
      ...(input.reason !== undefined && { reason: input.reason }),
      updatedAt: new Date(),
    })
    .where(and(eq(reservations.id, id), eq(reservations.farmId, farmId)));

  return getReservationById(id, farmId);
}

export async function deleteReservation(id: string, farmId: string): Promise<void> {
  await db
    .delete(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.farmId, farmId)));
}
