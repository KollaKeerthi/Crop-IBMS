"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProductionSites, createProductionSite, updateProductionSite, deleteProductionSite } from "../api";
import type { CreateProductionSiteInput, UpdateProductionSiteInput } from "../schema";

export const PROD_SITES_QUERY_KEY = ["production-sites"];

export function useProductionSites() {
  return useQuery({ queryKey: PROD_SITES_QUERY_KEY, queryFn: listProductionSites });
}

export function useCreateProductionSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductionSiteInput) => createProductionSite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROD_SITES_QUERY_KEY }),
  });
}

export function useUpdateProductionSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductionSiteInput }) =>
      updateProductionSite(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROD_SITES_QUERY_KEY }),
  });
}

export function useDeleteProductionSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProductionSite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROD_SITES_QUERY_KEY }),
  });
}
