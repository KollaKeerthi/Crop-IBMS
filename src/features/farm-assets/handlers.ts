import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import { farmMemberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { listFarmAssets, getFarmAssetById } from "./queries";
import { insertFarmAsset, updateFarmAsset, deleteFarmAsset } from "./mutations";
import type { CreateFarmAssetInput, UpdateFarmAssetInput, FarmAsset } from "./schema";

async function assertFarmAccess(farmId: string, userId: string) {
  const [m] = await db
    .select()
    .from(farmMemberships)
    .where(and(eq(farmMemberships.farmId, farmId), eq(farmMemberships.userId, userId)));
  if (!m) throw new ApiError(403, "forbidden", "Access denied.");
}

export async function listFarmAssetsHandler(ctx: ApiContext, farmId: string): Promise<FarmAsset[]> {
  await assertFarmAccess(farmId, ctx.userId);
  return listFarmAssets(farmId);
}

export async function createFarmAssetHandler(
  ctx: ApiContext,
  input: CreateFarmAssetInput
): Promise<FarmAsset> {
  await assertFarmAccess(input.farmId, ctx.userId);
  const asset = await insertFarmAsset(input);
  await logAudit({
    userId: ctx.userId,
    action: "farm_asset.created",
    resource: asset.id,
    metadata: { assetType: input.assetType },
  });
  return asset as unknown as FarmAsset;
}

export async function updateFarmAssetHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateFarmAssetInput
): Promise<FarmAsset> {
  await assertFarmAccess(farmId, ctx.userId);
  const existing = await getFarmAssetById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Asset not found.");
  const updated = await updateFarmAsset(id, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update asset.");
  await logAudit({ userId: ctx.userId, action: "farm_asset.updated", resource: id });
  return updated as unknown as FarmAsset;
}

export async function deleteFarmAssetHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  await assertFarmAccess(farmId, ctx.userId);
  const existing = await getFarmAssetById(id, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Asset not found.");
  await deleteFarmAsset(id, farmId);
  await logAudit({ userId: ctx.userId, action: "farm_asset.deleted", resource: id });
}
