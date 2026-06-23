"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api";
import type {
  CreateCropDataInput,
  UpdateCropDataInput,
  UpdateProgramInfoInput,
  UpdateNurseryInput,
  UpdateRevenueInput,
} from "../schema";

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
    mutationFn: ({
      id,
      farmId,
      input,
    }: {
      id: string;
      farmId: string;
      input: UpdateCropDataInput;
    }) => api.updateCropData(id, farmId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["crop-data", variables.id] });
      qc.invalidateQueries({ queryKey: ["crop-data"] });
    },
  });
}

export function useDeleteCropData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string }) => api.deleteCropData(id, farmId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data"] }),
  });
}

export function useUpdateProgramInfo(cropDataId: string, farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProgramInfoInput) => api.updateProgramInfo(cropDataId, farmId, input),
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

export function useUpdateRevenue(cropDataId: string, farmId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRevenueInput) => api.updateRevenue(cropDataId, farmId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] }),
  });
}

export function useUpdateSection(cropDataId: string, farmId: string, section: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api.updateSection(cropDataId, farmId, section, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] }),
  });
}

export function useCollectionMutations(cropDataId: string, farmId: string, collection: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] });
  const create = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      api.createCollectionRow(cropDataId, farmId, collection, input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ rowId, input }: { rowId: string; input: Record<string, unknown> }) =>
      api.updateCollectionRow(cropDataId, farmId, collection, rowId, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (rowId: string) => api.deleteCollectionRow(cropDataId, farmId, collection, rowId),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

export function useMediaMutations(cropDataId: string, farmId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] });
  const upload = useMutation({
    mutationFn: (file: File) => api.uploadMedia(cropDataId, farmId, file),
    onSuccess: invalidate,
  });
  const addLink = useMutation({
    mutationFn: (input: { url: string; name?: string }) =>
      api.addMediaLink(cropDataId, farmId, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (mediaId: string) => api.deleteMedia(cropDataId, farmId, mediaId),
    onSuccess: invalidate,
  });
  return { upload, addLink, remove };
}

export function useUpdateModule(cropDataId: string, farmId: string, moduleType: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.updateModule(cropDataId, farmId, moduleType, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-data", cropDataId] }),
  });
}
