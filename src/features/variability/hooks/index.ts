"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVariability, createVariability, updateVariability, deleteVariability } from "../api";
import type { CreateVariabilityInput, UpdateVariabilityInput } from "../schema";

export const variabilityKey = (farmId: string | null) => ["variability", farmId];

export function useVariability(farmId: string | null) {
  return useQuery({
    queryKey: variabilityKey(farmId),
    queryFn: () => fetchVariability(farmId),
    enabled: farmId !== undefined,
  });
}

export function useCreateVariability(farmId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVariabilityInput) => createVariability(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: variabilityKey(farmId) }),
  });
}

export function useUpdateVariability(farmId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVariabilityInput }) =>
      updateVariability(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: variabilityKey(farmId) }),
  });
}

export function useDeleteVariability(farmId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVariability(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: variabilityKey(farmId) }),
  });
}
