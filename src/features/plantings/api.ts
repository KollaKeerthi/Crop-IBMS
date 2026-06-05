import { apiFetch } from "@/lib/api/client";
import {
  PlantingSchema,
  PlantingsResponseSchema,
  type CreatePlantingInput,
  type UpdatePlantingInput,
  type Planting,
} from "./schema";

export function listPlantings(farmId: string, seasonId?: string): Promise<Planting[]> {
  const params = new URLSearchParams({ farmId });
  if (seasonId) params.set("seasonId", seasonId);
  return apiFetch(`/api/v1/plantings?${params.toString()}`, {
    responseSchema: PlantingsResponseSchema,
  });
}

export function getPlanting(id: string, farmId: string): Promise<Planting> {
  return apiFetch(`/api/v1/plantings/${id}?farmId=${farmId}`, {
    responseSchema: PlantingSchema,
  });
}

export function createPlanting(input: CreatePlantingInput): Promise<Planting> {
  return apiFetch("/api/v1/plantings", {
    method: "POST",
    body: input,
    responseSchema: PlantingSchema,
  });
}

export function updatePlanting(
  farmId: string,
  id: string,
  input: UpdatePlantingInput
): Promise<Planting> {
  return apiFetch(`/api/v1/plantings/${id}`, {
    method: "PATCH",
    body: input,
    responseSchema: PlantingSchema,
  });
}

export function deletePlanting(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/plantings/${id}?farmId=${farmId}`, { method: "DELETE" });
}
