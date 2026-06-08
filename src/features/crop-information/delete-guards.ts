import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activeTimeActivities,
  activeTimes,
  blockMaster,
  cropData,
  cropTypes,
  cropVarieties,
  densityMaster,
  plantings,
  tasks,
  variability,
} from "@/db/schema";
import { ApiError } from "@/lib/api/errors";

type UsageCheck = {
  label: string;
  query: Promise<unknown[]>;
};

async function findUsage(checks: UsageCheck[]): Promise<string | null> {
  for (const check of checks) {
    const rows = await check.query;
    if (rows.length > 0) return check.label;
  }
  return null;
}

function blockDelete(message: string) {
  throw new ApiError(409, "in_use", message);
}

export async function assertCropCanDelete(cropId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "crop types",
      query: db
        .select({ id: cropTypes.id })
        .from(cropTypes)
        .where(eq(cropTypes.cropId, cropId))
        .limit(1),
    },
    {
      label: "crop varieties",
      query: db
        .select({ id: cropVarieties.id })
        .from(cropVarieties)
        .where(eq(cropVarieties.cropId, cropId))
        .limit(1),
    },
    {
      label: "crop data",
      query: db
        .select({ id: cropData.id })
        .from(cropData)
        .where(eq(cropData.cropId, cropId))
        .limit(1),
    },
    {
      label: "plantings",
      query: db
        .select({ id: plantings.id })
        .from(plantings)
        .where(eq(plantings.cropId, cropId))
        .limit(1),
    },
    {
      label: "lead times",
      query: db
        .select({ id: activeTimes.id })
        .from(activeTimes)
        .where(eq(activeTimes.cropId, cropId))
        .limit(1),
    },
    {
      label: "density master",
      query: db
        .select({ id: densityMaster.id })
        .from(densityMaster)
        .where(eq(densityMaster.cropId, cropId))
        .limit(1),
    },
    {
      label: "tasks",
      query: db.select({ id: tasks.id }).from(tasks).where(eq(tasks.cropId, cropId)).limit(1),
    },
    {
      label: "block suitable crops",
      query: db
        .select({ id: blockMaster.id })
        .from(blockMaster)
        .where(
          sql`${blockMaster.suitableCrops} @> ${JSON.stringify([{ cropId }])}::jsonb OR ${blockMaster.suitableCrops} @> ${JSON.stringify([cropId])}::jsonb`
        )
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This crop is used in ${usedIn} and cannot be deleted.`);
}

export async function assertCropTypeCanDelete(typeId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "crop data",
      query: db
        .select({ id: cropData.id })
        .from(cropData)
        .where(eq(cropData.cropTypeId, typeId))
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This crop type is used in ${usedIn} and cannot be deleted.`);
}

export async function assertCropVarietyCanDelete(varietyId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "crop data",
      query: db
        .select({ id: cropData.id })
        .from(cropData)
        .where(eq(cropData.varietyId, varietyId))
        .limit(1),
    },
    {
      label: "plantings",
      query: db
        .select({ id: plantings.id })
        .from(plantings)
        .where(eq(plantings.varietyId, varietyId))
        .limit(1),
    },
    {
      label: "lead times",
      query: db
        .select({ id: activeTimes.id })
        .from(activeTimes)
        .where(eq(activeTimes.varietyId, varietyId))
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This crop variety is used in ${usedIn} and cannot be deleted.`);
}

export async function assertSeasonCanDelete(seasonId: string, farmId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "crop data",
      query: db
        .select({ id: cropData.id })
        .from(cropData)
        .where(and(eq(cropData.seasonId, seasonId), eq(cropData.farmId, farmId)))
        .limit(1),
    },
    {
      label: "plantings",
      query: db
        .select({ id: plantings.id })
        .from(plantings)
        .where(and(eq(plantings.seasonId, seasonId), eq(plantings.farmId, farmId)))
        .limit(1),
    },
    {
      label: "lead times",
      query: db
        .select({ id: activeTimes.id })
        .from(activeTimes)
        .where(and(eq(activeTimes.seasonId, seasonId), eq(activeTimes.farmId, farmId)))
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This season is used in ${usedIn} and cannot be deleted.`);
}

export async function assertActivityCanDelete(activityId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "lead time activities",
      query: db
        .select({ id: activeTimeActivities.id })
        .from(activeTimeActivities)
        .where(eq(activeTimeActivities.activityId, activityId))
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This activity is used in lead times and cannot be deleted.`);
}

export async function assertProductionTypeCanDelete(productionTypeId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "lead times",
      query: db
        .select({ id: activeTimes.id })
        .from(activeTimes)
        .where(eq(activeTimes.productionTypeId, productionTypeId))
        .limit(1),
    },
    {
      label: "variability",
      query: db
        .select({ id: variability.id })
        .from(variability)
        .where(eq(variability.productionTypeId, productionTypeId))
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This production type is used in ${usedIn} and cannot be deleted.`);
}

export async function assertBlockCanDelete(blockId: string, farmId: string): Promise<void> {
  const usedIn = await findUsage([
    {
      label: "plantings",
      query: db
        .select({ id: plantings.id })
        .from(plantings)
        .where(and(eq(plantings.blockMasterId, blockId), eq(plantings.farmId, farmId)))
        .limit(1),
    },
    {
      label: "tasks",
      query: db
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.blockMasterId, blockId), eq(tasks.farmId, farmId)))
        .limit(1),
    },
  ]);

  if (usedIn) blockDelete(`This block is used in ${usedIn} and cannot be deleted.`);
}
