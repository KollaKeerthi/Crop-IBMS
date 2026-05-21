"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFarmAssets, createFarmAsset, updateFarmAsset, deleteFarmAsset } from "../api";
import type { CreateFarmAssetInput, UpdateFarmAssetInput } from "../schema";

const key = (farmId: string) => ["farm-assets", farmId];

export function useFarmAssets(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? key(farmId) : ["farm-assets", null],
    queryFn: () => listFarmAssets(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateFarmAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFarmAsset,
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: key(v.farmId) }),
  });
}

export function useUpdateFarmAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      farmId,
      input,
    }: {
      id: string;
      farmId: string;
      input: UpdateFarmAssetInput;
    }) => updateFarmAsset(id, farmId, input),
    onSuccess: (data) => {
      if (data) qc.invalidateQueries({ queryKey: key(data.farmId) });
    },
  });
}

export function useDeleteFarmAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string }) => deleteFarmAsset(id, farmId),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: key(v.farmId) }),
  });
}
