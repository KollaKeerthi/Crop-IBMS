import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  activeTimes,
  activeTimeActivities,
  crops,
  cropVarieties,
  seasons,
  productionTypes,
} from "@/db/schema";
import type { ActiveTime, ActiveTimeActivity } from "./schema";

function toActiveTimeActivity(row: typeof activeTimeActivities.$inferSelect): ActiveTimeActivity {
  return {
    id: row.id,
    activeTimeId: row.activeTimeId,
    activityId: row.activityId ?? null,
    weekNumber: row.weekNumber ?? null,
    dayOffset: row.dayOffset ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildActiveTime(
  row: typeof activeTimes.$inferSelect,
  cropName: string | null,
  varietyName: string | null,
  seasonName: string | null,
  productionTypeName: string | null,
  activityRows: (typeof activeTimeActivities.$inferSelect)[]
): ActiveTime {
  return {
    id: row.id,
    farmId: row.farmId,
    leadTimeRefNumber: row.leadTimeRefNumber ?? null,
    cropId: row.cropId ?? null,
    varietyId: row.varietyId ?? null,
    seasonId: row.seasonId ?? null,
    productionTypeId: row.productionTypeId ?? null,
    leadTimeType: row.leadTimeType ?? null,
    materialArrival: row.materialArrival ?? null,
    sowingMale: row.sowingMale ?? null,
    sowingFemale: row.sowingFemale ?? null,
    plantingMale: row.plantingMale ?? null,
    plantingFemale: row.plantingFemale ?? null,
    pollinationStart: row.pollinationStart ?? null,
    pollinationEnd: row.pollinationEnd ?? null,
    harvestingStart: row.harvestingStart ?? null,
    harvestingEnd: row.harvestingEnd ?? null,
    isActive: row.isActive,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
    cropName,
    varietyName,
    seasonName,
    productionTypeName,
    activities: activityRows.map(toActiveTimeActivity),
  };
}

export async function listActiveTimes(farmId: string): Promise<ActiveTime[]> {
  const rows = await db
    .select({
      activeTime: activeTimes,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      seasonName: seasons.name,
      productionTypeName: productionTypes.code,
    })
    .from(activeTimes)
    .leftJoin(crops, eq(activeTimes.cropId, crops.id))
    .leftJoin(cropVarieties, eq(activeTimes.varietyId, cropVarieties.id))
    .leftJoin(seasons, eq(activeTimes.seasonId, seasons.id))
    .leftJoin(productionTypes, eq(activeTimes.productionTypeId, productionTypes.id))
    .where(eq(activeTimes.farmId, farmId))
    .orderBy(activeTimes.createdAt);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.activeTime.id);
  const activityRows = await db
    .select()
    .from(activeTimeActivities)
    .where(
      ids.length === 1
        ? eq(activeTimeActivities.activeTimeId, ids[0]!)
        : inArray(activeTimeActivities.activeTimeId, ids)
    );

  const activityMap = new Map<string, (typeof activeTimeActivities.$inferSelect)[]>();
  for (const a of activityRows) {
    const list = activityMap.get(a.activeTimeId) ?? [];
    list.push(a);
    activityMap.set(a.activeTimeId, list);
  }

  return rows.map((r) =>
    buildActiveTime(
      r.activeTime,
      r.cropName ?? null,
      r.varietyName ?? null,
      r.seasonName ?? null,
      r.productionTypeName ?? null,
      activityMap.get(r.activeTime.id) ?? []
    )
  );
}

export async function getActiveTimeById(id: string, farmId: string): Promise<ActiveTime | null> {
  const rows = await db
    .select({
      activeTime: activeTimes,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      seasonName: seasons.name,
      productionTypeName: productionTypes.code,
    })
    .from(activeTimes)
    .leftJoin(crops, eq(activeTimes.cropId, crops.id))
    .leftJoin(cropVarieties, eq(activeTimes.varietyId, cropVarieties.id))
    .leftJoin(seasons, eq(activeTimes.seasonId, seasons.id))
    .leftJoin(productionTypes, eq(activeTimes.productionTypeId, productionTypes.id))
    .where(and(eq(activeTimes.id, id), eq(activeTimes.farmId, farmId)));

  const row = rows[0];
  if (!row) return null;

  const activityRows = await db
    .select()
    .from(activeTimeActivities)
    .where(eq(activeTimeActivities.activeTimeId, id));

  return buildActiveTime(
    row.activeTime,
    row.cropName ?? null,
    row.varietyName ?? null,
    row.seasonName ?? null,
    row.productionTypeName ?? null,
    activityRows
  );
}
