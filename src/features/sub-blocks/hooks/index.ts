"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listSubBlocks, createSubBlock, updateSubBlock, deleteSubBlock } from "../api";
import type { CreateSubBlockInput, UpdateSubBlockInput } from "../schema";

export const subBlocksKey = (blockId: string) => ["sub-blocks", blockId];

export function useSubBlocks(blockId: string, farmId: string) {
  return useQuery({
    queryKey: subBlocksKey(blockId),
    queryFn: () => listSubBlocks(blockId, farmId),
    enabled: !!blockId && !!farmId,
  });
}

export function useCreateSubBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubBlockInput) => createSubBlock(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: subBlocksKey(variables.blockId) });
    },
  });
}

export function useUpdateSubBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      blockId,
      farmId,
      input,
    }: {
      id: string;
      blockId: string;
      farmId: string;
      input: UpdateSubBlockInput;
    }) => updateSubBlock(id, farmId, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: subBlocksKey(variables.blockId) });
    },
  });
}

export function useDeleteSubBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, farmId }: { id: string; farmId: string; blockId: string }) =>
      deleteSubBlock(id, farmId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: subBlocksKey(variables.blockId) });
    },
  });
}
