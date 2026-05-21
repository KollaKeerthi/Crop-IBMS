import { apiFetch } from "@/lib/api/client";
import {
  FieldSchema,
  FieldsResponseSchema,
  GreenhouseSchema,
  GreenhousesResponseSchema,
  BlockSchema,
  BlocksResponseSchema,
  LocationHierarchySchema,
  type CreateFieldInput,
  type UpdateFieldInput,
  type Field,
  type CreateGreenhouseInput,
  type UpdateGreenhouseInput,
  type Greenhouse,
  type CreateBlockInput,
  type UpdateBlockInput,
  type Block,
  type LocationHierarchy,
} from "./schema";

// ── Fields ────────────────────────────────────────────────────────────────────

export function listFields(farmId: string): Promise<Field[]> {
  return apiFetch(`/api/v1/locations/fields?farmId=${farmId}`, {
    responseSchema: FieldsResponseSchema,
  });
}

export function createField(input: CreateFieldInput): Promise<Field> {
  return apiFetch("/api/v1/locations/fields", {
    method: "POST",
    body: input,
    responseSchema: FieldSchema,
  });
}

export function updateField(id: string, farmId: string, input: UpdateFieldInput): Promise<Field> {
  return apiFetch(`/api/v1/locations/fields/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: FieldSchema,
  });
}

export function deleteField(id: string, farmId: string): Promise<void> {
  return apiFetch(`/api/v1/locations/fields/${id}?farmId=${farmId}`, { method: "DELETE" });
}

// ── Greenhouses ───────────────────────────────────────────────────────────────

export function listGreenhouses(farmId: string): Promise<Greenhouse[]> {
  return apiFetch(`/api/v1/locations/greenhouses?farmId=${farmId}`, {
    responseSchema: GreenhousesResponseSchema,
  });
}

export function createGreenhouse(input: CreateGreenhouseInput): Promise<Greenhouse> {
  return apiFetch("/api/v1/locations/greenhouses", {
    method: "POST",
    body: input,
    responseSchema: GreenhouseSchema,
  });
}

export function updateGreenhouse(
  id: string,
  farmId: string,
  input: UpdateGreenhouseInput
): Promise<Greenhouse> {
  return apiFetch(`/api/v1/locations/greenhouses/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: GreenhouseSchema,
  });
}

export function deleteGreenhouse(id: string, farmId: string): Promise<void> {
  return apiFetch(`/api/v1/locations/greenhouses/${id}?farmId=${farmId}`, { method: "DELETE" });
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export function listBlocks(farmId: string, parentId?: string): Promise<Block[]> {
  const params = new URLSearchParams({ farmId });
  if (parentId) params.set("parentId", parentId);
  return apiFetch(`/api/v1/locations/blocks?${params.toString()}`, {
    responseSchema: BlocksResponseSchema,
  });
}

export function createBlock(input: CreateBlockInput): Promise<Block> {
  return apiFetch("/api/v1/locations/blocks", {
    method: "POST",
    body: input,
    responseSchema: BlockSchema,
  });
}

export function updateBlock(id: string, farmId: string, input: UpdateBlockInput): Promise<Block> {
  return apiFetch(`/api/v1/locations/blocks/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: BlockSchema,
  });
}

export function deleteBlock(id: string, farmId: string): Promise<void> {
  return apiFetch(`/api/v1/locations/blocks/${id}?farmId=${farmId}`, { method: "DELETE" });
}

// ── Hierarchy ─────────────────────────────────────────────────────────────────

export function getLocationHierarchy(farmId: string): Promise<LocationHierarchy> {
  return apiFetch(`/api/v1/locations/farms/${farmId}/hierarchy`, {
    responseSchema: LocationHierarchySchema,
  });
}
