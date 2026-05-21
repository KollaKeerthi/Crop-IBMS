import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { seasons } from "@/db/schema";
import type { Season } from "./schema";

type SeasonRow = typeof seasons.$inferSelect;

function toSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    year: row.year,
    startDate: row.startDate
      ? row.startDate instanceof Date
        ? row.startDate.toISOString().split("T")[0]!
        : String(row.startDate)
      : null,
    endDate: row.endDate
      ? row.endDate instanceof Date
        ? row.endDate.toISOString().split("T")[0]!
        : String(row.endDate)
      : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSeasons(farmId: string): Promise<Season[]> {
  const rows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.farmId, farmId))
    .orderBy(seasons.year, seasons.name);
  return rows.map(toSeason);
}

export async function getSeasonById(seasonId: string, farmId: string): Promise<Season | null> {
  const [row] = await db
    .select()
    .from(seasons)
    .where(and(eq(seasons.id, seasonId), eq(seasons.farmId, farmId)));
  return row ? toSeason(row) : null;
}
