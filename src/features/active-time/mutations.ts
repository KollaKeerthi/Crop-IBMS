import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activeTimes, activeTimeActivities } from "@/db/schema";
import type { CreateActiveTimeInput, UpdateActiveTimeInput, AddActivityToActiveTimeInput, ActiveTime, ActiveTimeActivity } from "./schema";
import { getActiveTimeById } from "./queries";

export async function createActiveTime(
  farmId: string,
  input: CreateActiveTimeInput
): Promise<ActiveTime | null> {
  const [row] = await db
    .insert(activeTimes)
    .values({
      farmId,
      cropId: input.cropId ?? null,
      varietyId: input.varietyId ?? null,
      seasonId: input.seasonId ?? null,
      productionTypeId: input.productionTypeId ?? null,
      leadTimeType: input.leadTimeType ?? null,
      isActive: input.isActive ?? true,
      notes: input.notes ?? null,
    })
    .returning();

  if (!row) return null;
  return getActiveTimeById(row.id, farmId);
}

export async function updateActiveTime(
  id: string,
  input: UpdateActiveTimeInput
): Promise<void> {
  await db
    .update(activeTimes)
    .set({
      ...(input.cropId !== undefined && { cropId: input.cropId }),
      ...(input.varietyId !== undefined && { varietyId: input.varietyId }),
      ...(input.seasonId !== undefined && { seasonId: input.seasonId }),
      ...(input.productionTypeId !== undefined && { productionTypeId: input.productionTypeId }),
      ...(input.leadTimeType !== undefined && { leadTimeType: input.leadTimeType }),
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
  await db
    .delete(activeTimeActivities)
    .where(eq(activeTimeActivities.id, activityId));
}
