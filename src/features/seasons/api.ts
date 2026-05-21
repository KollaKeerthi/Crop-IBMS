import { apiFetch } from "@/lib/api/client";
import {
  SeasonSchema,
  SeasonsResponseSchema,
  type CreateSeasonInput,
  type UpdateSeasonInput,
  type Season,
} from "./schema";

export function listSeasons(farmId: string): Promise<Season[]> {
  return apiFetch(`/api/v1/seasons?farmId=${farmId}`, { responseSchema: SeasonsResponseSchema });
}

export function createSeason(farmId: string, input: CreateSeasonInput): Promise<Season> {
  return apiFetch(`/api/v1/seasons?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: SeasonSchema,
  });
}

export function updateSeason(farmId: string, id: string, input: UpdateSeasonInput): Promise<Season> {
  return apiFetch(`/api/v1/seasons/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: SeasonSchema,
  });
}

export function deleteSeason(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/seasons/${id}?farmId=${farmId}`, { method: "DELETE" });
}
