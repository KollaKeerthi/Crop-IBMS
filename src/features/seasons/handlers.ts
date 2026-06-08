import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listSeasons, getSeasonById } from "./queries";
import { insertSeason, updateSeason, deleteSeason } from "./mutations";
import type { CreateSeasonInput, UpdateSeasonInput, Season } from "./schema";
import { assertSeasonCanDelete } from "@/features/crop-information/delete-guards";

export async function listSeasonsHandler(ctx: ApiContext, farmId: string): Promise<Season[]> {
  return listSeasons(farmId);
}

export async function getSeasonHandler(
  ctx: ApiContext,
  seasonId: string,
  farmId: string
): Promise<Season> {
  const season = await getSeasonById(seasonId, farmId);
  if (!season) throw new ApiError(404, "not_found", "Season not found.");
  return season;
}

export async function createSeasonHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateSeasonInput
): Promise<Season> {
  const season = await insertSeason(farmId, input);
  if (!season) throw new ApiError(500, "internal_error", "Could not create season.");

  log.info({ userId: ctx.userId, farmId, seasonId: season.id }, "seasons.created");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "season.created",
    resource: season.id,
    resourceName: season.name,
    newData: {
      name: season.name,
      year: season.year,
      startDate: season.startDate,
      endDate: season.endDate,
    } as Record<string, unknown>,
  });

  return season;
}

export async function updateSeasonHandler(
  ctx: ApiContext,
  seasonId: string,
  farmId: string,
  input: UpdateSeasonInput
): Promise<Season> {
  const existing = await getSeasonById(seasonId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Season not found.");

  const updated = await updateSeason(seasonId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update season.");

  log.info({ userId: ctx.userId, seasonId }, "seasons.updated");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "season.updated",
    resource: seasonId,
    resourceName: existing.name,
    previousData: {
      name: existing.name,
      year: existing.year,
      startDate: existing.startDate,
      endDate: existing.endDate,
    } as Record<string, unknown>,
    newData: {
      name: updated.name,
      year: updated.year,
      startDate: updated.startDate,
      endDate: updated.endDate,
    } as Record<string, unknown>,
  });

  return updated;
}

export async function deleteSeasonHandler(
  ctx: ApiContext,
  seasonId: string,
  farmId: string
): Promise<void> {
  const existing = await getSeasonById(seasonId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Season not found.");

  await assertSeasonCanDelete(seasonId, farmId);
  await deleteSeason(seasonId, farmId);

  log.info({ userId: ctx.userId, seasonId }, "seasons.deleted");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "season.deleted",
    resource: seasonId,
    resourceName: existing.name,
    previousData: { name: existing.name, year: existing.year } as Record<string, unknown>,
  });
}
