import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listPlantings, getPlantingById } from "./queries";
import { createPlanting, updatePlanting, deletePlanting } from "./mutations";
import type { CreatePlantingInput, UpdatePlantingInput, Planting } from "./schema";

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
    action: "planting.created",
    resource: planting.id,
    metadata: { farmId: input.farmId },
  });

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
  await logAudit({ userId: ctx.userId, action: "planting.updated", resource: id });

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
  await logAudit({ userId: ctx.userId, action: "planting.deleted", resource: id });
}
