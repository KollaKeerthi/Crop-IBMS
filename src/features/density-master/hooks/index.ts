"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDensityMaster, createDensityMaster, updateDensityMaster, deleteDensityMaster } from "../api";
import type { CreateDensityMasterInput, UpdateDensityMasterInput } from "../schema";

export const densityKey = (farmId: string) => ["density-master", farmId];

export function useDensityMaster(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? densityKey(farmId) : ["density-master", null],
    queryFn: () => listDensityMaster(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateDensityMaster(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDensityMasterInput) => createDensityMaster(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: densityKey(farmId) }),
  });
}

export function useUpdateDensityMaster(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDensityMasterInput }) =>
      updateDensityMaster(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: densityKey(farmId) }),
  });
}

export function useDeleteDensityMaster(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDensityMaster(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: densityKey(farmId) }),
  });
}
