import { apiFetch } from "@/lib/api/client";
import {
  DensityMasterSchema,
  DensityMasterResponseSchema,
  type CreateDensityMasterInput,
  type UpdateDensityMasterInput,
  type DensityMaster,
} from "./schema";

export function listDensityMaster(farmId: string): Promise<DensityMaster[]> {
  return apiFetch(`/api/v1/density-master?farmId=${farmId}`, { responseSchema: DensityMasterResponseSchema });
}

export function createDensityMaster(farmId: string, input: CreateDensityMasterInput): Promise<DensityMaster> {
  return apiFetch(`/api/v1/density-master?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: DensityMasterSchema,
  });
}

export function updateDensityMaster(farmId: string, id: string, input: UpdateDensityMasterInput): Promise<DensityMaster> {
  return apiFetch(`/api/v1/density-master/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: DensityMasterSchema,
  });
}

export function deleteDensityMaster(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/density-master/${id}?farmId=${farmId}`, { method: "DELETE" });
}
