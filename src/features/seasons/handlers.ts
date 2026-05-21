import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listSeasons, getSeasonById } from "./queries";
import { insertSeason, updateSeason, deleteSeason } from "./mutations";
import type { CreateSeasonInput, UpdateSeasonInput, Season } from "./schema";

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
    action: "season.created",
    resource: season.id,
    metadata: { name: input.name, farmId },
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
  await logAudit({ userId: ctx.userId, action: "season.updated", resource: seasonId });

  return updated;
}

export async function deleteSeasonHandler(
  ctx: ApiContext,
  seasonId: string,
  farmId: string
): Promise<void> {
  const existing = await getSeasonById(seasonId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Season not found.");

  await deleteSeason(seasonId, farmId);

  log.info({ userId: ctx.userId, seasonId }, "seasons.deleted");
  await logAudit({ userId: ctx.userId, action: "season.deleted", resource: seasonId });
}
