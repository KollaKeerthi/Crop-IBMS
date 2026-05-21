import { apiFetch } from "@/lib/api/client";
import type {
  CreateCropDataInput,
  UpdateCropDataInput,
  UpdateProgramInfoInput,
  UpdateNurseryInput,
} from "./schema";

export function listCropData(farmId: string) {
  return apiFetch<unknown[]>(`/api/v1/crop-data?farmId=${encodeURIComponent(farmId)}`);
}

export function getCropData(id: string, farmId: string) {
  return apiFetch<unknown>(`/api/v1/crop-data/${id}?farmId=${encodeURIComponent(farmId)}`);
}

export function createCropData(input: CreateCropDataInput) {
  return apiFetch<unknown>("/api/v1/crop-data", { method: "POST", body: input });
}

export function updateCropData(id: string, input: UpdateCropDataInput) {
  return apiFetch<unknown>(`/api/v1/crop-data/${id}`, { method: "PATCH", body: input });
}

export function deleteCropData(id: string, farmId: string) {
  return apiFetch<void>(`/api/v1/crop-data/${id}?farmId=${encodeURIComponent(farmId)}`, {
    method: "DELETE",
  });
}

export function updateProgramInfo(
  cropDataId: string,
  farmId: string,
  input: UpdateProgramInfoInput
) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/program-info?farmId=${encodeURIComponent(farmId)}`,
    { method: "PATCH", body: input }
  );
}

export function updateNursery(cropDataId: string, farmId: string, input: UpdateNurseryInput) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/nursery?farmId=${encodeURIComponent(farmId)}`,
    { method: "PATCH", body: input }
  );
}

export function updateModule(
  cropDataId: string,
  farmId: string,
  moduleType: string,
  data: Record<string, unknown>
) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/modules/${encodeURIComponent(moduleType)}?farmId=${encodeURIComponent(farmId)}`,
    { method: "PATCH", body: { data } }
  );
}
