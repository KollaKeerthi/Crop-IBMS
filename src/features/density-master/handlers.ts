import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listDensityMaster, getDensityById } from "./queries";
import { insertDensity, updateDensity, deleteDensity } from "./mutations";
import type { CreateDensityMasterInput, UpdateDensityMasterInput, DensityMaster } from "./schema";

export async function listDensityMasterHandler(
  ctx: ApiContext,
  farmId: string
): Promise<DensityMaster[]> {
  return listDensityMaster(farmId);
}

export async function getDensityHandler(
  ctx: ApiContext,
  densityId: string,
  farmId: string
): Promise<DensityMaster> {
  const density = await getDensityById(densityId, farmId);
  if (!density) throw new ApiError(404, "not_found", "Density record not found.");
  return density;
}

export async function createDensityHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateDensityMasterInput
): Promise<DensityMaster> {
  const density = await insertDensity(farmId, input);
  if (!density) throw new ApiError(500, "internal_error", "Could not create density record.");

  log.info({ userId: ctx.userId, farmId, densityId: density.id }, "density_master.created");
  await logAudit({
    userId: ctx.userId,
    action: "density_master.created",
    resource: density.id,
    metadata: { farmId },
    newValue: density,
  });

  return density;
}

export async function updateDensityHandler(
  ctx: ApiContext,
  densityId: string,
  farmId: string,
  input: UpdateDensityMasterInput
): Promise<DensityMaster> {
  const existing = await getDensityById(densityId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Density record not found.");

  const updated = await updateDensity(densityId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update density record.");

  log.info({ userId: ctx.userId, densityId }, "density_master.updated");
  await logAudit({
    userId: ctx.userId,
    action: "density_master.updated",
    resource: densityId,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteDensityHandler(
  ctx: ApiContext,
  densityId: string,
  farmId: string
): Promise<void> {
  const existing = await getDensityById(densityId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Density record not found.");

  await deleteDensity(densityId, farmId);

  log.info({ userId: ctx.userId, densityId }, "density_master.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "density_master.deleted",
    resource: densityId,
    previousValue: existing,
  });
}
