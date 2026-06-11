"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listStakeholders, createStakeholder, updateStakeholder, deleteStakeholder } from "../api";
import type { CreateStakeholderInput, UpdateStakeholderInput } from "../schema";

export const stakeholderKey = (farmId: string) => ["stakeholder-master", farmId];

export function useStakeholderMaster(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? stakeholderKey(farmId) : ["stakeholder-master", null],
    queryFn: () => listStakeholders(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateStakeholder(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStakeholderInput) => createStakeholder(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKey(farmId) }),
  });
}

export function useUpdateStakeholder(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStakeholderInput }) =>
      updateStakeholder(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKey(farmId) }),
  });
}

export function useDeleteStakeholder(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStakeholder(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: stakeholderKey(farmId) }),
  });
}
