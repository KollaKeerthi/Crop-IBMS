"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listBlockMaster, createBlockMaster, updateBlockMaster, deleteBlockMaster } from "../api";
import type { CreateBlockMasterInput, UpdateBlockMasterInput } from "../schema";

export const blockMasterKey = (farmId: string) => ["block-master", farmId];

export function useBlockMaster(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? blockMasterKey(farmId) : ["block-master", null],
    queryFn: () => listBlockMaster(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateBlockMaster(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockMasterInput) => createBlockMaster(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: blockMasterKey(farmId) }),
  });
}

export function useUpdateBlockMaster(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBlockMasterInput }) =>
      updateBlockMaster(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: blockMasterKey(farmId) }),
  });
}

export function useDeleteBlockMaster(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlockMaster(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: blockMasterKey(farmId) }),
  });
}
