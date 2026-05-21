import { apiFetch } from "@/lib/api/client";
import { FarmAssetsResponseSchema, FarmAssetSchema } from "./schema";
import type { CreateFarmAssetInput, UpdateFarmAssetInput, FarmAsset } from "./schema";

export function listFarmAssets(farmId: string): Promise<FarmAsset[]> {
  return apiFetch(`/api/v1/farm-assets?farmId=${farmId}`, { responseSchema: FarmAssetsResponseSchema });
}

export function createFarmAsset(input: CreateFarmAssetInput): Promise<FarmAsset> {
  return apiFetch("/api/v1/farm-assets", { method: "POST", body: input, responseSchema: FarmAssetSchema });
}

export function updateFarmAsset(id: string, farmId: string, input: UpdateFarmAssetInput): Promise<FarmAsset> {
  return apiFetch(`/api/v1/farm-assets/${id}?farmId=${farmId}`, { method: "PATCH", body: input, responseSchema: FarmAssetSchema });
}

export function deleteFarmAsset(id: string, farmId: string): Promise<void> {
  return apiFetch(`/api/v1/farm-assets/${id}?farmId=${farmId}`, { method: "DELETE" });
}
