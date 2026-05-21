"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPlantings, createPlanting, updatePlanting, deletePlanting } from "../api";
import type { CreatePlantingInput, UpdatePlantingInput } from "../schema";

export const plantingKey = (farmId: string, seasonId?: string) =>
  seasonId ? ["plantings", farmId, seasonId] : ["plantings", farmId];

export function usePlantings(farmId: string | null, seasonId?: string) {
  return useQuery({
    queryKey: farmId ? plantingKey(farmId, seasonId) : ["plantings", null],
    queryFn: () => listPlantings(farmId!, seasonId),
    enabled: !!farmId,
  });
}

export function useCreatePlanting(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlantingInput) => createPlanting(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plantings", farmId] }),
  });
}

export function useUpdatePlanting(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlantingInput }) =>
      updatePlanting(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plantings", farmId] }),
  });
}

export function useDeletePlanting(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlanting(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plantings", farmId] }),
  });
}
