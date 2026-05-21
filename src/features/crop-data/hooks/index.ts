"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type { CreateCropDataInput, UpdateCropDataInput, UpdateProgramInfoInput, UpdateNurseryInput } from "../schema";

export function useCropDataList(farmId: string | null) {
  return useQuery({
    queryKey: ["crop-data", farmId],
    queryFn: () => api.listCropData(farmId!),
    enabled: !!farmId,
  });
}

export function useCropDataDetail(id: string, farmId: string | null) {
  return useQuery({
    queryKey: ["crop-data", id],
    queryFn: () => api.getCropData(id, farmId!),
    enabled: !!farmId && !!id,
  });
}

export function useCreateCropData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCropDataInput) => api.createCropData(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data"] }),
  });
}

export function useUpdateCropData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCropDataInput }) =>
      api.updateCropData(id, input),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["crop-data", variables.id] }),
  });
}

export function useDeleteCropData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string }) =>
      api.deleteCropData(id, farmId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data"] }),
  });
}

export function useUpdateProgramInfo(cropDataId: string, farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProgramInfoInput) =>
      api.updateProgramInfo(cropDataId, farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] }),
  });
}

export function useUpdateNursery(cropDataId: string, farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNurseryInput) => api.updateNursery(cropDataId, farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] }),
  });
}

export function useUpdateModule(cropDataId: string, farmId: string, moduleType: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.updateModule(cropDataId, farmId, moduleType, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] }),
  });
}
