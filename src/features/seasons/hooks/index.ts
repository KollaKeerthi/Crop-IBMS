"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listSeasons, createSeason, updateSeason, deleteSeason } from "../api";
import type { CreateSeasonInput, UpdateSeasonInput } from "../schema";

export const seasonKey = (farmId: string) => ["seasons", farmId];

export function useSeasons(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? seasonKey(farmId) : ["seasons", null],
    queryFn: () => listSeasons(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateSeason(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSeasonInput) => createSeason(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: seasonKey(farmId) }),
  });
}

export function useUpdateSeason(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSeasonInput }) =>
      updateSeason(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: seasonKey(farmId) }),
  });
}

export function useDeleteSeason(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSeason(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: seasonKey(farmId) }),
  });
}
