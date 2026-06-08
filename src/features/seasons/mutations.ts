import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { seasons } from "@/db/schema";
import type { CreateSeasonInput, UpdateSeasonInput, Season } from "./schema";
import { getSeasonById } from "./queries";
import { formatDateInput, getWeekEndDate, getWeekStartDate } from "@/lib/week-calendar";

function deriveSeasonDates(input: {
  year: number;
  startWeek?: number | null;
  endWeek?: number | null;
}) {
  return {
    startDate:
      input.startWeek && input.year
        ? formatDateInput(getWeekStartDate(input.year, input.startWeek))
        : undefined,
    endDate:
      input.endWeek && input.year
        ? formatDateInput(getWeekEndDate(input.year, input.endWeek))
        : undefined,
  };
}

export async function insertSeason(
  farmId: string,
  input: CreateSeasonInput
): Promise<Season | null> {
  const derivedDates = deriveSeasonDates(input);
  const [row] = await db
    .insert(seasons)
    .values({
      farmId,
      name: input.name,
      year: input.year,
      startWeek: input.startWeek ?? null,
      endWeek: input.endWeek ?? null,
      startDate: derivedDates.startDate ? new Date(derivedDates.startDate) : null,
      endDate: derivedDates.endDate ? new Date(derivedDates.endDate) : null,
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
  const existing = await getSeasonById(seasonId, farmId);
  const year = input.year ?? existing?.year;
  const startWeek = input.startWeek === undefined ? existing?.startWeek : input.startWeek;
  const endWeek = input.endWeek === undefined ? existing?.endWeek : input.endWeek;
  const derived: { startDate?: string; endDate?: string } =
    year &&
    (input.year !== undefined || input.startWeek !== undefined || input.endWeek !== undefined)
      ? deriveSeasonDates({
          year,
          startWeek: startWeek ?? undefined,
          endWeek: endWeek ?? undefined,
        })
      : {};

  await db
    .update(seasons)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.startWeek !== undefined && { startWeek: input.startWeek }),
      ...(input.endWeek !== undefined && { endWeek: input.endWeek }),
      ...(derived.startDate !== undefined && {
        startDate: derived.startDate ? new Date(derived.startDate) : null,
      }),
      ...(derived.endDate !== undefined && {
        endDate: derived.endDate ? new Date(derived.endDate) : null,
      }),
    })
    .where(and(eq(seasons.id, seasonId), eq(seasons.farmId, farmId)));

  return getSeasonById(seasonId, farmId);
}

export async function deleteSeason(seasonId: string, farmId: string): Promise<void> {
  await db.delete(seasons).where(and(eq(seasons.id, seasonId), eq(seasons.farmId, farmId)));
}
