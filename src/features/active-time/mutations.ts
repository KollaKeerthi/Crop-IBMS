import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activeTimes, activeTimeActivities } from "@/db/schema";
import type {
  CreateActiveTimeInput,
  UpdateActiveTimeInput,
  AddActivityToActiveTimeInput,
  ActiveTime,
  ActiveTimeActivity,
} from "./schema";
import { getActiveTimeById } from "./queries";

export async function createActiveTime(
  farmId: string,
  input: CreateActiveTimeInput
): Promise<ActiveTime | null> {
  const [row] = await db
    .insert(activeTimes)
    .values({
      farmId,
      leadTimeRefNumber: input.leadTimeRefNumber ?? null,
      cropId: input.cropId ?? null,
      varietyId: input.varietyId ?? null,
      seasonId: input.seasonId ?? null,
      productionTypeId: input.productionTypeId ?? null,
      leadTimeType: input.leadTimeType ?? null,
      materialArrival: input.materialArrival ?? null,
      sowingMale: input.sowingMale ?? null,
      sowingFemale: input.sowingFemale ?? null,
      plantingMale: input.plantingMale ?? null,
      plantingFemale: input.plantingFemale ?? null,
      pollinationStart: input.pollinationStart ?? null,
      pollinationEnd: input.pollinationEnd ?? null,
      harvestingStart: input.harvestingStart ?? null,
      harvestingEnd: input.harvestingEnd ?? null,
      isActive: input.isActive ?? true,
      notes: input.notes ?? null,
    })
    .returning();

  if (!row) return null;
  return getActiveTimeById(row.id, farmId);
}

export async function updateActiveTime(id: string, input: UpdateActiveTimeInput): Promise<void> {
  await db
    .update(activeTimes)
    .set({
      ...(input.leadTimeRefNumber !== undefined && { leadTimeRefNumber: input.leadTimeRefNumber }),
      ...(input.cropId !== undefined && { cropId: input.cropId }),
      ...(input.varietyId !== undefined && { varietyId: input.varietyId }),
      ...(input.seasonId !== undefined && { seasonId: input.seasonId }),
      ...(input.productionTypeId !== undefined && { productionTypeId: input.productionTypeId }),
      ...(input.leadTimeType !== undefined && { leadTimeType: input.leadTimeType }),
      ...(input.materialArrival !== undefined && { materialArrival: input.materialArrival }),
      ...(input.sowingMale !== undefined && { sowingMale: input.sowingMale }),
      ...(input.sowingFemale !== undefined && { sowingFemale: input.sowingFemale }),
      ...(input.plantingMale !== undefined && { plantingMale: input.plantingMale }),
      ...(input.plantingFemale !== undefined && { plantingFemale: input.plantingFemale }),
      ...(input.pollinationStart !== undefined && { pollinationStart: input.pollinationStart }),
      ...(input.pollinationEnd !== undefined && { pollinationEnd: input.pollinationEnd }),
      ...(input.harvestingStart !== undefined && { harvestingStart: input.harvestingStart }),
      ...(input.harvestingEnd !== undefined && { harvestingEnd: input.harvestingEnd }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.notes !== undefined && { notes: input.notes }),
      updatedAt: new Date(),
    })
    .where(eq(activeTimes.id, id));
}

export async function deleteActiveTime(id: string): Promise<void> {
  await db.delete(activeTimes).where(eq(activeTimes.id, id));
}

export async function addActivityToActiveTime(
  activeTimeId: string,
  input: AddActivityToActiveTimeInput
): Promise<ActiveTimeActivity | null> {
  const [row] = await db
    .insert(activeTimeActivities)
    .values({
      activeTimeId,
      activityId: input.activityId,
      weekNumber: input.weekNumber,
      dayOffset: input.dayOffset ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  if (!row) return null;
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

export async function removeActivityFromActiveTime(activityId: string): Promise<void> {
  await db.delete(activeTimeActivities).where(eq(activeTimeActivities.id, activityId));
}
