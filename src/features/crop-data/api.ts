import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type {
  CreateCropDataInput,
  UpdateCropDataInput,
  UpdateProgramInfoInput,
  UpdateNurseryInput,
  UpdateRevenueInput,
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

export function updateCropData(id: string, farmId: string, input: UpdateCropDataInput) {
  return apiFetch<unknown>(`/api/v1/crop-data/${id}?farmId=${encodeURIComponent(farmId)}`, {
    method: "PATCH",
    body: input,
  });
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

export function updateRevenue(cropDataId: string, farmId: string, input: UpdateRevenueInput) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/revenue?farmId=${encodeURIComponent(farmId)}`,
    { method: "PATCH", body: input }
  );
}

export function updateSection(
  cropDataId: string,
  farmId: string,
  section: string,
  input: Record<string, unknown>
) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/sections/${encodeURIComponent(section)}?farmId=${encodeURIComponent(farmId)}`,
    { method: "PATCH", body: input }
  );
}

export function createCollectionRow(
  cropDataId: string,
  farmId: string,
  collection: string,
  input: Record<string, unknown>
) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/collections/${encodeURIComponent(collection)}?farmId=${encodeURIComponent(farmId)}`,
    { method: "POST", body: input }
  );
}

export function updateCollectionRow(
  cropDataId: string,
  farmId: string,
  collection: string,
  rowId: string,
  input: Record<string, unknown>
) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/collections/${encodeURIComponent(collection)}/${rowId}?farmId=${encodeURIComponent(farmId)}`,
    { method: "PATCH", body: input }
  );
}

export function deleteCollectionRow(
  cropDataId: string,
  farmId: string,
  collection: string,
  rowId: string
) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/collections/${encodeURIComponent(collection)}/${rowId}?farmId=${encodeURIComponent(farmId)}`,
    { method: "DELETE" }
  );
}

export async function uploadMedia(cropDataId: string, farmId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    `/api/v1/crop-data/${cropDataId}/media?farmId=${encodeURIComponent(farmId)}`,
    { method: "POST", body: fd }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "upload_failed",
      json?.error?.message ?? "Upload failed."
    );
  }
  return json?.data ?? json;
}

export function deleteMedia(cropDataId: string, farmId: string, mediaId: string) {
  return apiFetch<unknown>(
    `/api/v1/crop-data/${cropDataId}/media/${mediaId}?farmId=${encodeURIComponent(farmId)}`,
    { method: "DELETE" }
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
