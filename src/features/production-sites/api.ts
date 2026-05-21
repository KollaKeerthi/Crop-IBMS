import { apiFetch } from "@/lib/api/client";
import {
  ProductionSiteSchema,
  ProductionSitesResponseSchema,
  type CreateProductionSiteInput,
  type UpdateProductionSiteInput,
  type ProductionSite,
} from "./schema";

export function listProductionSites(): Promise<ProductionSite[]> {
  return apiFetch("/api/v1/production-sites", { responseSchema: ProductionSitesResponseSchema });
}

export function createProductionSite(input: CreateProductionSiteInput): Promise<ProductionSite> {
  return apiFetch("/api/v1/production-sites", {
    method: "POST",
    body: input,
    responseSchema: ProductionSiteSchema,
  });
}

export function updateProductionSite(id: string, input: UpdateProductionSiteInput): Promise<ProductionSite> {
  return apiFetch(`/api/v1/production-sites/${id}`, {
    method: "PATCH",
    body: input,
    responseSchema: ProductionSiteSchema,
  });
}

export function deleteProductionSite(id: string): Promise<void> {
  return apiFetch(`/api/v1/production-sites/${id}`, { method: "DELETE" });
}
