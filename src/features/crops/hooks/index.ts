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
  updateCropType,
  createCropVariety,
  deleteCropVariety,
  updateCropVariety,
} from "../api";
import type {
  CreateCropInput,
  UpdateCropInput,
  CreateCropTypeInput,
  UpdateCropTypeInput,
  CreateCropVarietyInput,
  UpdateCropVarietyInput,
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

// Standalone variants - cropId is provided per mutation call, not per hook.
export function useCreateStandaloneCropType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cropId, input }: { cropId: string; input: CreateCropTypeInput }) =>
      createCropType(cropId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useUpdateStandaloneCropType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cropId,
      typeId,
      input,
    }: {
      cropId: string;
      typeId: string;
      input: UpdateCropTypeInput;
    }) => updateCropType(cropId, typeId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useDeleteStandaloneCropType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cropId, typeId }: { cropId: string; typeId: string }) =>
      deleteCropType(cropId, typeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useCreateStandaloneCropVariety() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cropId, input }: { cropId: string; input: CreateCropVarietyInput }) =>
      createCropVariety(cropId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useUpdateStandaloneCropVariety() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cropId,
      varietyId,
      input,
    }: {
      cropId: string;
      varietyId: string;
      input: UpdateCropVarietyInput;
    }) => updateCropVariety(cropId, varietyId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}

export function useDeleteStandaloneCropVariety() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cropId, varietyId }: { cropId: string; varietyId: string }) =>
      deleteCropVariety(cropId, varietyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: CROPS_QUERY_KEY }),
  });
}
