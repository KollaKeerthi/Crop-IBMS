import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { plantings, crops, cropVarieties, seasons } from "@/db/schema";
import type { Planting } from "./schema";

type PlantingRow = typeof plantings.$inferSelect;

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString().split("T")[0]! : null;
}

function buildPlanting(
  row: PlantingRow,
  cropName: string | null,
  varietyName: string | null,
  seasonName: string | null
): Planting {
  return {
    id: row.id,
    farmId: row.farmId,
    cropId: row.cropId ?? null,
    varietyId: row.varietyId ?? null,
    seasonId: row.seasonId ?? null,
    blockMasterId: row.blockMasterId ?? null,
    locationType: row.locationType ?? null,
    status: row.status as Planting["status"],
    plantingMethod: (row.plantingMethod as Planting["plantingMethod"]) ?? null,
    nurseryStartDate: formatDate(row.nurseryStartDate),
    fieldPlantingDate: formatDate(row.fieldPlantingDate),
    firstHarvestDate: formatDate(row.firstHarvestDate),
    harvestEndDate: formatDate(row.harvestEndDate),
    numRows: row.numRows ?? null,
    spacingM: row.spacingM ?? null,
    areaSqm: row.areaSqm ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    cropName,
    varietyName,
    seasonName,
  };
}

export async function listPlantings(farmId: string, seasonId?: string): Promise<Planting[]> {
  const conditions = [eq(plantings.farmId, farmId)];
  if (seasonId) {
    conditions.push(eq(plantings.seasonId, seasonId));
  }

  const rows = await db
    .select({
      planting: plantings,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      seasonName: seasons.name,
    })
    .from(plantings)
    .leftJoin(crops, eq(plantings.cropId, crops.id))
    .leftJoin(cropVarieties, eq(plantings.varietyId, cropVarieties.id))
    .leftJoin(seasons, eq(plantings.seasonId, seasons.id))
    .where(and(...conditions))
    .orderBy(desc(plantings.nurseryStartDate));

  return rows.map((r) =>
    buildPlanting(r.planting, r.cropName ?? null, r.varietyName ?? null, r.seasonName ?? null)
  );
}

export async function getPlantingById(id: string, farmId: string): Promise<Planting | null> {
  const rows = await db
    .select({
      planting: plantings,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      seasonName: seasons.name,
    })
    .from(plantings)
    .leftJoin(crops, eq(plantings.cropId, crops.id))
    .leftJoin(cropVarieties, eq(plantings.varietyId, cropVarieties.id))
    .leftJoin(seasons, eq(plantings.seasonId, seasons.id))
    .where(and(eq(plantings.id, id), eq(plantings.farmId, farmId)));

  const row = rows[0];
  if (!row) return null;
  return buildPlanting(
    row.planting,
    row.cropName ?? null,
    row.varietyName ?? null,
    row.seasonName ?? null
  );
}
