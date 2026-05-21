"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFarms, createFarm, updateFarm, deleteFarm } from "../api";
import type { CreateFarmInput, UpdateFarmInput } from "../schema";

export const FARMS_QUERY_KEY = ["farms"];

export function useFarms() {
  return useQuery({ queryKey: FARMS_QUERY_KEY, queryFn: listFarms });
}

export function useCreateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFarmInput) => createFarm(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: FARMS_QUERY_KEY }),
  });
}

export function useUpdateFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFarmInput }) => updateFarm(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: FARMS_QUERY_KEY }),
  });
}

export function useDeleteFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFarm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FARMS_QUERY_KEY }),
  });
}
