import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { farmAssets } from "@/db/schema";
import type { FarmAsset } from "./schema";
import { GEOMETRY_TYPES } from "./schema";

function toFarmAsset(row: typeof farmAssets.$inferSelect): FarmAsset {
  return {
    id: row.id,
    farmId: row.farmId,
    assetType: row.assetType,
    name: row.name ?? null,
    geometryType: (row.geometryType as typeof GEOMETRY_TYPES[number]) ?? "Point",
    coordinates: row.coordinates,
    properties: (row.properties as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listFarmAssets(farmId: string): Promise<FarmAsset[]> {
  const rows = await db.select().from(farmAssets).where(eq(farmAssets.farmId, farmId));
  return rows.map(toFarmAsset);
}

export async function getFarmAssetById(id: string, farmId: string): Promise<FarmAsset | null> {
  const [row] = await db
    .select()
    .from(farmAssets)
    .where(and(eq(farmAssets.id, id), eq(farmAssets.farmId, farmId)));
  return row ? toFarmAsset(row) : null;
}
