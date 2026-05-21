"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCrops,
  getCrop,
  createCrop,
  updateCrop,
  deleteCrop,
  createCropType,
  deleteCropType,
  createCropVariety,
  deleteCropVariety,
} from "../api";
import type {
  CreateCropInput,
  UpdateCropInput,
  CreateCropTypeInput,
  CreateCropVarietyInput,
} from "../schema";

export const CROPS_QUERY_KEY = ["crops"];
export const cropKey = (id: string) => ["crops", id];

export function useCrops(search?: string) {
  return useQuery({
    queryKey: search ? [...CROPS_QUERY_KEY, { search }] : CROPS_QUERY_KEY,
    queryFn: () => listCrops(search),
  });
}

export function useCrop(id: string) {
  return useQuery({ queryKey: cropKey(id), queryFn: () => getCrop(id) });
}

export function useCreateCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCropInput) => createCrop(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useUpdateCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCropInput }) => updateCrop(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: cropKey(id) });
    },
  });
}

export function useDeleteCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCrop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useCreateCropType(cropId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCropTypeInput) => createCropType(cropId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: cropKey(cropId) });
    },
  });
}

export function useDeleteCropType(cropId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (typeId: string) => deleteCropType(cropId, typeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: cropKey(cropId) });
    },
  });
}

export function useCreateCropVariety(cropId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCropVarietyInput) => createCropVariety(cropId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: cropKey(cropId) });
    },
  });
}

export function useDeleteCropVariety(cropId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (varietyId: string) => deleteCropVariety(cropId, varietyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: cropKey(cropId) });
    },
  });
}
