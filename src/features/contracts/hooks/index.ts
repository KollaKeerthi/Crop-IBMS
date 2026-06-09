"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  allocateContract,
  createContract,
  deleteContract,
  listContracts,
  unallocateContract,
  updateContract,
} from "../api";
import type { AllocateContractInput, CreateContractInput, UpdateContractInput } from "../schema";

export const contractKey = (farmId: string, year?: number) =>
  year ? ["contracts", farmId, year] : ["contracts", farmId];

export function useContracts(farmId: string | null, year?: number) {
  return useQuery({
    queryKey: farmId ? contractKey(farmId, year) : ["contracts", null],
    queryFn: () => listContracts(farmId!, year),
    enabled: !!farmId,
  });
}

export function useCreateContract(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContractInput) => createContract(farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts", farmId] }),
  });
}

export function useUpdateContract(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContractInput }) =>
      updateContract(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts", farmId] }),
  });
}

export function useAllocateContract(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AllocateContractInput }) =>
      allocateContract(farmId, id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts", farmId] }),
  });
}

export function useUnallocateContract(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unallocateContract(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts", farmId] }),
  });
}

export function useDeleteContract(farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContract(farmId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts", farmId] }),
  });
}
