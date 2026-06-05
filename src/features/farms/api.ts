import { apiFetch } from "@/lib/api/client";
import {
  FarmSchema,
  FarmsResponseSchema,
  type CreateFarmInput,
  type UpdateFarmInput,
  type Farm,
} from "./schema";

export function listFarms(): Promise<Farm[]> {
  return apiFetch("/api/v1/farms?limit=200", { responseSchema: FarmsResponseSchema });
}

export function getFarm(id: string): Promise<Farm> {
  return apiFetch(`/api/v1/farms/${id}`, { responseSchema: FarmSchema });
}

export function createFarm(input: CreateFarmInput): Promise<Farm> {
  return apiFetch("/api/v1/farms", {
    method: "POST",
    body: input,
    responseSchema: FarmSchema,
  });
}

export function updateFarm(id: string, input: UpdateFarmInput): Promise<Farm> {
  return apiFetch(`/api/v1/farms/${id}`, {
    method: "PATCH",
    body: input,
    responseSchema: FarmSchema,
  });
}

export function deleteFarm(id: string): Promise<void> {
  return apiFetch(`/api/v1/farms/${id}`, { method: "DELETE" });
}
