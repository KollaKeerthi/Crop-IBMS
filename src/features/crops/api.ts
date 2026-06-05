import { apiFetch } from "@/lib/api/client";
import {
  CropSchema,
  CropsResponseSchema,
  CropTypeSchema,
  CropVarietySchema,
  type CreateCropInput,
  type UpdateCropInput,
  type CreateCropTypeInput,
  type UpdateCropTypeInput,
  type CreateCropVarietyInput,
  type UpdateCropVarietyInput,
  type Crop,
  type CropType,
  type CropVariety,
} from "./schema";

export function listCrops(search?: string): Promise<Crop[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/v1/crops${qs}`, { responseSchema: CropsResponseSchema });
}

export function getCrop(id: string): Promise<Crop> {
  return apiFetch(`/api/v1/crops/${id}`, { responseSchema: CropSchema });
}

export function createCrop(input: CreateCropInput): Promise<Crop> {
  return apiFetch("/api/v1/crops", {
    method: "POST",
    body: input,
    responseSchema: CropSchema,
  });
}

export function updateCrop(id: string, input: UpdateCropInput): Promise<Crop> {
  return apiFetch(`/api/v1/crops/${id}`, {
    method: "PATCH",
    body: input,
    responseSchema: CropSchema,
  });
}

export function deleteCrop(id: string): Promise<void> {
  return apiFetch(`/api/v1/crops/${id}`, { method: "DELETE" });
}

export function createCropType(cropId: string, input: CreateCropTypeInput): Promise<CropType> {
  return apiFetch(`/api/v1/crops/${cropId}/types`, {
    method: "POST",
    body: input,
    responseSchema: CropTypeSchema,
  });
}

export function deleteCropType(cropId: string, typeId: string): Promise<void> {
  return apiFetch(`/api/v1/crops/${cropId}/types/${typeId}`, { method: "DELETE" });
}

export function updateCropType(
  cropId: string,
  typeId: string,
  input: UpdateCropTypeInput
): Promise<CropType> {
  return apiFetch(`/api/v1/crops/${cropId}/types/${typeId}`, {
    method: "PATCH",
    body: input,
    responseSchema: CropTypeSchema,
  });
}

export function createCropVariety(
  cropId: string,
  input: CreateCropVarietyInput
): Promise<CropVariety> {
  return apiFetch(`/api/v1/crops/${cropId}/varieties`, {
    method: "POST",
    body: input,
    responseSchema: CropVarietySchema,
  });
}

export function deleteCropVariety(cropId: string, varietyId: string): Promise<void> {
  return apiFetch(`/api/v1/crops/${cropId}/varieties/${varietyId}`, { method: "DELETE" });
}

export function updateCropVariety(
  cropId: string,
  varietyId: string,
  input: UpdateCropVarietyInput
): Promise<CropVariety> {
  return apiFetch(`/api/v1/crops/${cropId}/varieties/${varietyId}`, {
    method: "PATCH",
    body: input,
    responseSchema: CropVarietySchema,
  });
}
