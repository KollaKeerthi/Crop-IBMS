import { apiFetch } from "@/lib/api/client";
import { ProductionTypesResponseSchema, ProductionTypeSchema } from "./schema";
import type { CreateProductionTypeInput, UpdateProductionTypeInput, ProductionType } from "./schema";

export function listProductionTypes(): Promise<ProductionType[]> {
  return apiFetch("/api/v1/production-types", { responseSchema: ProductionTypesResponseSchema });
}

export function createProductionType(input: CreateProductionTypeInput): Promise<ProductionType> {
  return apiFetch("/api/v1/production-types", { method: "POST", body: input, responseSchema: ProductionTypeSchema });
}

export function updateProductionType(id: string, input: UpdateProductionTypeInput): Promise<ProductionType> {
  return apiFetch(`/api/v1/production-types/${id}`, { method: "PATCH", body: input, responseSchema: ProductionTypeSchema });
}

export function deleteProductionType(id: string): Promise<void> {
  return apiFetch(`/api/v1/production-types/${id}`, { method: "DELETE" });
}
