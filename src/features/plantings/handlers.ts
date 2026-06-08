import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { db } from "@/db";
import { activeTimes, activeTimeActivities, activities, tasks } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { listPlantings, getPlantingById } from "./queries";
import { createPlanting, updatePlanting, deletePlanting } from "./mutations";
import type { CreatePlantingInput, UpdatePlantingInput, Planting } from "./schema";

async function autoGenerateTasks(farmId: string, planting: Planting): Promise<void> {
  const farmActiveTimes = await db
    .select()
    .from(activeTimes)
    .where(and(eq(activeTimes.farmId, farmId), eq(activeTimes.isActive, true)));

  if (farmActiveTimes.length === 0) return;

  const match =
    farmActiveTimes.find(
      (at) =>
        at.cropId === planting.cropId &&
        at.varietyId === planting.varietyId &&
        at.seasonId === planting.seasonId
    ) ??
    farmActiveTimes.find(
      (at) => at.cropId === planting.cropId && at.varietyId === planting.varietyId && !at.seasonId
    ) ??
    farmActiveTimes.find(
      (at) => at.cropId === planting.cropId && !at.varietyId && at.seasonId === planting.seasonId
    ) ??
    farmActiveTimes.find((at) => at.cropId === planting.cropId && !at.varietyId && !at.seasonId);

  if (!match) return;

  const activityEntries = await db
    .select()
    .from(activeTimeActivities)
    .where(eq(activeTimeActivities.activeTimeId, match.id));

  if (activityEntries.length === 0) return;

  const activityIds = activityEntries
    .map((a) => a.activityId)
    .filter((id): id is string => id != null);

  const activityRows =
    activityIds.length > 0
      ? await db.select().from(activities).where(inArray(activities.id, activityIds))
      : [];
  const nameMap = new Map(activityRows.map((a) => [a.id, a.name]));

  const baseIso = planting.nurseryStartDate ?? planting.fieldPlantingDate;
  if (!baseIso) return;
  const base = new Date(baseIso + "T00:00:00");

  for (const entry of activityEntries) {
    if (!entry.weekNumber) continue;
    const name = (entry.activityId && nameMap.get(entry.activityId)) ?? "Planned Activity";
    const offsetMs = ((entry.weekNumber - 1) * 7 + (entry.dayOffset ?? 0)) * 86_400_000;
    const dueDate = new Date(base.getTime() + offsetMs);

    await db.insert(tasks).values({
      farmId,
      title: name,
      priority: "Medium",
      status: "Pending",
      dueDate,
      cropId: planting.cropId,
      blockMasterId: planting.blockMasterId,
      associatedTo: planting.id,
      notes: entry.notes,
    });
  }
}

export async function listPlantingsHandler(
  ctx: ApiContext,
  farmId: string,
  seasonId?: string
): Promise<Planting[]> {
  return listPlantings(farmId, seasonId);
}

export async function getPlantingHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<Planting> {
  const planting = await getPlantingById(id, farmId);
  if (!planting) throw new ApiError(404, "not_found", "Planting not found.");
  return planting;
}

export async function createPlantingHandler(
  ctx: ApiContext,
  input: CreatePlantingInput
): Promise<Planting> {
  const planting = await createPlanting(input);
  if (!planting) throw new ApiError(500, "internal_error", "Could not create planting.");

  log.info(
    { userId: ctx.userId, farmId: input.farmId, plantingId: planting.id },
    "planting.created"
  );
  await logAudit({
    userId: ctx.userId,
    farmId: input.farmId,
    action: "planting.created",
    resource: planting.id,
    newData: {
      status: planting.status,
      plantingMethod: planting.plantingMethod,
      areaSqm: planting.areaSqm,
    } as Record<string, unknown>,
  });

  // Auto-generate tasks from the matching active time plan (best-effort, non-blocking)
  autoGenerateTasks(input.farmId, planting).catch((err) =>
    log.warn({ err, plantingId: planting.id }, "planting.task_autogen_failed")
  );

  return planting;
}

export async function updatePlantingHandler(
  ctx: ApiContext,
  id: string,
  input: UpdatePlantingInput
): Promise<Planting> {
  const existing = await getPlantingById(id, input.farmId);
  if (!existing) throw new ApiError(404, "not_found", "Planting not found.");

  await updatePlanting(id, input);

  const updated = await getPlantingById(id, input.farmId);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update planting.");

  log.info({ userId: ctx.userId, plantingId: id }, "planting.updated");
  await logAudit({
    userId: ctx.userId,
    farmId: input.farmId,
    action: "planting.updated",
    resource: id,
    previousData: {
      status: existing.status,
      plantingMethod: existing.plantingMethod,
      areaSqm: existing.areaSqm,
      notes: existing.notes,
    } as Record<string, unknown>,
    newData: {
      status: updated.status,
      plantingMethod: updated.plantingMethod,
      areaSqm: updated.areaSqm,
      notes: updated.notes,
    } as Record<string, unknown>,
  });

  return updated;
}

export async function deletePlantingHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  const existing = await getPlantingById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Planting not found.");

  await deletePlanting(id);

  log.info({ userId: ctx.userId, plantingId: id }, "planting.deleted");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "planting.deleted",
    resource: id,
    previousData: { status: existing.status, areaSqm: existing.areaSqm } as Record<string, unknown>,
  });
}
