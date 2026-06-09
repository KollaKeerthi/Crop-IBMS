import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { blockMaster, cropTypes, crops, productionTypes, reservations, seasons } from "@/db/schema";
import type { Reservation } from "./schema";

type ReservationRow = typeof reservations.$inferSelect;

function toReservation(
  row: ReservationRow,
  cropName: string | null,
  cropTypeName: string | null,
  productionTypeName: string | null,
  blockName: string | null,
  seasonName: string | null
): Reservation {
  return {
    id: row.id,
    farmId: row.farmId,
    type: row.type as Reservation["type"],
    status: row.status as Reservation["status"],
    productionTypeId: row.productionTypeId ?? null,
    cropId: row.cropId ?? null,
    cropTypeId: row.cropTypeId ?? null,
    blockId: row.blockId ?? null,
    activeTimeId: row.activeTimeId ?? null,
    seasonId: row.seasonId ?? null,
    year: row.year,
    pollinationStartWeek: row.pollinationStartWeek ?? null,
    materialArrivalWeek: row.materialArrivalWeek ?? null,
    plantingWeek: row.plantingWeek ?? null,
    endWeek: row.endWeek ?? null,
    startWeek: row.startWeek ?? null,
    noOfPlantsFemale: row.noOfPlantsFemale ?? null,
    plantsPerM2: row.plantsPerM2 ?? null,
    surfaceFemale: row.surfaceFemale ?? null,
    surfaceMale: row.surfaceMale ?? null,
    mfSameBlock: row.mfSameBlock,
    totalSurface: row.totalSurface ?? null,
    reservationRef: row.reservationRef ?? null,
    reason: row.reason ?? null,
    cropName,
    cropTypeName,
    productionTypeName,
    blockName,
    seasonName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listReservations(farmId: string, year?: number): Promise<Reservation[]> {
  const conditions = [eq(reservations.farmId, farmId)];
  if (year) conditions.push(eq(reservations.year, year));

  const rows = await db
    .select({
      reservation: reservations,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      productionTypeName: productionTypes.code,
      blockName: blockMaster.blockName,
      seasonName: seasons.name,
    })
    .from(reservations)
    .leftJoin(crops, eq(reservations.cropId, crops.id))
    .leftJoin(cropTypes, eq(reservations.cropTypeId, cropTypes.id))
    .leftJoin(productionTypes, eq(reservations.productionTypeId, productionTypes.id))
    .leftJoin(blockMaster, eq(reservations.blockId, blockMaster.id))
    .leftJoin(seasons, eq(reservations.seasonId, seasons.id))
    .where(and(...conditions))
    .orderBy(reservations.createdAt);

  return rows.map((r) =>
    toReservation(
      r.reservation,
      r.cropName ?? null,
      r.cropTypeName ?? null,
      r.productionTypeName ?? null,
      r.blockName ?? null,
      r.seasonName ?? null
    )
  );
}

export async function listUnallocatedReservations(farmId: string): Promise<Reservation[]> {
  const rows = await db
    .select({
      reservation: reservations,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      productionTypeName: productionTypes.code,
      blockName: blockMaster.blockName,
      seasonName: seasons.name,
    })
    .from(reservations)
    .leftJoin(crops, eq(reservations.cropId, crops.id))
    .leftJoin(cropTypes, eq(reservations.cropTypeId, cropTypes.id))
    .leftJoin(productionTypes, eq(reservations.productionTypeId, productionTypes.id))
    .leftJoin(blockMaster, eq(reservations.blockId, blockMaster.id))
    .leftJoin(seasons, eq(reservations.seasonId, seasons.id))
    .where(and(eq(reservations.farmId, farmId), isNull(reservations.blockId)))
    .orderBy(reservations.createdAt);

  return rows.map((r) =>
    toReservation(
      r.reservation,
      r.cropName ?? null,
      r.cropTypeName ?? null,
      r.productionTypeName ?? null,
      r.blockName ?? null,
      r.seasonName ?? null
    )
  );
}

export async function getReservationById(id: string, farmId: string): Promise<Reservation | null> {
  const rows = await db
    .select({
      reservation: reservations,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      productionTypeName: productionTypes.code,
      blockName: blockMaster.blockName,
      seasonName: seasons.name,
    })
    .from(reservations)
    .leftJoin(crops, eq(reservations.cropId, crops.id))
    .leftJoin(cropTypes, eq(reservations.cropTypeId, cropTypes.id))
    .leftJoin(productionTypes, eq(reservations.productionTypeId, productionTypes.id))
    .leftJoin(blockMaster, eq(reservations.blockId, blockMaster.id))
    .leftJoin(seasons, eq(reservations.seasonId, seasons.id))
    .where(and(eq(reservations.id, id), eq(reservations.farmId, farmId)));

  const row = rows[0];
  if (!row) return null;

  return toReservation(
    row.reservation,
    row.cropName ?? null,
    row.cropTypeName ?? null,
    row.productionTypeName ?? null,
    row.blockName ?? null,
    row.seasonName ?? null
  );
}
