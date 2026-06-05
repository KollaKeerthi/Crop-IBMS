import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { farmAssets } from "@/db/schema";
import type { CreateFarmAssetInput, UpdateFarmAssetInput } from "./schema";

export async function insertFarmAsset(input: CreateFarmAssetInput) {
  const [row] = await db
    .insert(farmAssets)
    .values({
      farmId: input.farmId,
      assetType: input.assetType,
      name: input.name ?? null,
      geometryType: input.geometryType,
      coordinates: input.coordinates,
      properties: input.properties ?? null,
    })
    .returning();
  return row!;
}

export async function updateFarmAsset(id: string, farmId: string, input: UpdateFarmAssetInput) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.assetType !== undefined) updates.assetType = input.assetType;
  if (input.name !== undefined) updates.name = input.name;
  if (input.geometryType !== undefined) updates.geometryType = input.geometryType;
  if (input.coordinates !== undefined) updates.coordinates = input.coordinates;
  if (input.properties !== undefined) updates.properties = input.properties;

  const [row] = await db
    .update(farmAssets)
    .set(updates)
    .where(and(eq(farmAssets.id, id), eq(farmAssets.farmId, farmId)))
    .returning();
  return row ?? null;
}

export async function deleteFarmAsset(id: string, farmId: string) {
  await db.delete(farmAssets).where(and(eq(farmAssets.id, id), eq(farmAssets.farmId, farmId)));
}
