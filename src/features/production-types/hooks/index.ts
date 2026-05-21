"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProductionTypes,
  createProductionType,
  updateProductionType,
  deleteProductionType,
} from "../api";
import type { CreateProductionTypeInput, UpdateProductionTypeInput } from "../schema";

const KEY = ["production-types"];

export function useProductionTypes() {
  return useQuery({ queryKey: KEY, queryFn: listProductionTypes });
}

export function useCreateProductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProductionType,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductionTypeInput }) =>
      updateProductionType(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProductionType,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
