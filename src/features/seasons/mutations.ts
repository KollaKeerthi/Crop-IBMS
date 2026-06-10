import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { seasons } from "@/db/schema";
import type { CreateSeasonInput, UpdateSeasonInput, Season } from "./schema";
import { getSeasonById } from "./queries";

export async function insertSeason(
  farmId: string,
  input: CreateSeasonInput
): Promise<Season | null> {
  const [row] = await db
    .insert(seasons)
    .values({
      farmId,
      name: input.name,
      year: input.year ?? 0,
      startWeek: input.startWeek ?? null,
      endWeek: input.endWeek ?? null,
      startDate: null,
      endDate: null,
    })
    .returning();

  if (!row) return null;
  return getSeasonById(row.id, farmId);
}

export async function updateSeason(
  seasonId: string,
  farmId: string,
  input: UpdateSeasonInput
): Promise<Season | null> {
  await db
    .update(seasons)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.startWeek !== undefined && { startWeek: input.startWeek }),
      ...(input.endWeek !== undefined && { endWeek: input.endWeek }),
    })
    .where(and(eq(seasons.id, seasonId), eq(seasons.farmId, farmId)));

  return getSeasonById(seasonId, farmId);
}

export async function deleteSeason(seasonId: string, farmId: string): Promise<void> {
  await db.delete(seasons).where(and(eq(seasons.id, seasonId), eq(seasons.farmId, farmId)));
}
