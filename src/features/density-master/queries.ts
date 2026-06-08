import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { densityMaster } from "@/db/schema";
import type { DensityMaster } from "./schema";

type DensityRow = typeof densityMaster.$inferSelect;

function toDensity(row: DensityRow): DensityMaster {
  return {
    id: row.id,
    farmId: row.farmId,
    cropId: row.cropId ?? null,
    maleDensity: row.maleDensity ?? null,
    femaleDensity: row.femaleDensity ?? null,
    spacingM: row.spacingM ?? null,
    rowSpacingM: row.rowSpacingM ?? null,
    validFrom: row.validFrom,
    validTo: row.validTo,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listDensityMaster(farmId: string): Promise<DensityMaster[]> {
  const rows = await db
    .select()
    .from(densityMaster)
    .where(eq(densityMaster.farmId, farmId))
    .orderBy(densityMaster.createdAt);
  return rows.map(toDensity);
}

export async function getDensityById(
  densityId: string,
  farmId: string
): Promise<DensityMaster | null> {
  const [row] = await db
    .select()
    .from(densityMaster)
    .where(and(eq(densityMaster.id, densityId), eq(densityMaster.farmId, farmId)));
  return row ? toDensity(row) : null;
}
