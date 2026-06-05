import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { getFarmsByUserId, getFarmById } from "./queries";
import { createFarm, updateFarm, deleteFarm } from "./mutations";
import type { CreateFarmInput, UpdateFarmInput, Farm } from "./schema";

export async function listFarmsHandler(ctx: ApiContext): Promise<Farm[]> {
  return getFarmsByUserId(ctx.userId);
}

export async function getFarmHandler(ctx: ApiContext, farmId: string): Promise<Farm> {
  const farm = await getFarmById(farmId, ctx.userId);
  if (!farm) throw new ApiError(404, "not_found", "Farm not found.");
  return farm;
}

export async function createFarmHandler(ctx: ApiContext, input: CreateFarmInput): Promise<Farm> {
  const farm = await createFarm(ctx.userId, input);
  if (!farm) throw new ApiError(500, "internal_error", "Could not create farm.");

  log.info({ userId: ctx.userId, farmId: farm.id }, "farms.created");
  await logAudit({
    userId: ctx.userId,
    action: "farm.created",
    resource: farm.id,
    metadata: { name: input.name },
  });

  return farm;
}

export async function updateFarmHandler(
  ctx: ApiContext,
  farmId: string,
  input: UpdateFarmInput
): Promise<Farm> {
  const existing = await getFarmById(farmId, ctx.userId);
  if (!existing) throw new ApiError(404, "not_found", "Farm not found.");

  const updated = await updateFarm(farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update farm.");

  log.info({ userId: ctx.userId, farmId }, "farms.updated");
  await logAudit({
    userId: ctx.userId,
    action: "farm.updated",
    resource: farmId,
  });

  return updated;
}

export async function deleteFarmHandler(ctx: ApiContext, farmId: string): Promise<void> {
  const existing = await getFarmById(farmId, ctx.userId);
  if (!existing) throw new ApiError(404, "not_found", "Farm not found.");

  await deleteFarm(farmId);

  log.info({ userId: ctx.userId, farmId }, "farms.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "farm.deleted",
    resource: farmId,
  });
}
