"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listFields,
  createField,
  updateField,
  deleteField,
  listGreenhouses,
  createGreenhouse,
  updateGreenhouse,
  deleteGreenhouse,
  listBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  getLocationHierarchy,
} from "../api";
import type {
  CreateFieldInput,
  UpdateFieldInput,
  CreateGreenhouseInput,
  UpdateGreenhouseInput,
  CreateBlockInput,
  UpdateBlockInput,
} from "../schema";

// ── Query keys ────────────────────────────────────────────────────────────────

export const fieldsKey = (farmId: string) => ["locations", "fields", farmId];
export const greenhousesKey = (farmId: string) => ["locations", "greenhouses", farmId];
export const blocksKey = (farmId: string, parentId?: string) =>
  parentId ? ["locations", "blocks", farmId, parentId] : ["locations", "blocks", farmId];
export const hierarchyKey = (farmId: string) => ["locations", "hierarchy", farmId];

// ── Fields ────────────────────────────────────────────────────────────────────

export function useFields(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? fieldsKey(farmId) : ["locations", "fields", null],
    queryFn: () => listFields(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFieldInput) => createField(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: fieldsKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

export function useUpdateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId, input }: { id: string; farmId: string; input: UpdateFieldInput }) =>
      updateField(id, farmId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: fieldsKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

export function useDeleteField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string }) => deleteField(id, farmId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: fieldsKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

// ── Greenhouses ───────────────────────────────────────────────────────────────

export function useGreenhouses(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? greenhousesKey(farmId) : ["locations", "greenhouses", null],
    queryFn: () => listGreenhouses(farmId!),
    enabled: !!farmId,
  });
}

export function useCreateGreenhouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGreenhouseInput) => createGreenhouse(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: greenhousesKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

export function useUpdateGreenhouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      farmId,
      input,
    }: {
      id: string;
      farmId: string;
      input: UpdateGreenhouseInput;
    }) => updateGreenhouse(id, farmId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: greenhousesKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

export function useDeleteGreenhouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string }) => deleteGreenhouse(id, farmId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: greenhousesKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export function useBlocks(farmId: string | null, parentId?: string) {
  return useQuery({
    queryKey: farmId ? blocksKey(farmId, parentId) : ["locations", "blocks", null],
    queryFn: () => listBlocks(farmId!, parentId),
    enabled: !!farmId,
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockInput) => createBlock(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: blocksKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: fieldsKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

export function useUpdateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId, input }: { id: string; farmId: string; input: UpdateBlockInput }) =>
      updateBlock(id, farmId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: blocksKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string }) => deleteBlock(id, farmId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: blocksKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: fieldsKey(variables.farmId) });
      qc.invalidateQueries({ queryKey: hierarchyKey(variables.farmId) });
    },
  });
}

// ── Hierarchy ─────────────────────────────────────────────────────────────────

export function useLocationHierarchy(farmId: string | null) {
  return useQuery({
    queryKey: farmId ? hierarchyKey(farmId) : ["locations", "hierarchy", null],
    queryFn: () => getLocationHierarchy(farmId!),
    enabled: !!farmId,
  });
}
