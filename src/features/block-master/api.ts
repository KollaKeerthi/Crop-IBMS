import { apiFetch } from "@/lib/api/client";
import {
  BlockMasterSchema,
  BlockMasterResponseSchema,
  type CreateBlockMasterInput,
  type UpdateBlockMasterInput,
  type BlockMaster,
} from "./schema";

export function listBlockMaster(farmId: string): Promise<BlockMaster[]> {
  return apiFetch(`/api/v1/block-master?farmId=${farmId}`, { responseSchema: BlockMasterResponseSchema });
}

export function createBlockMaster(farmId: string, input: CreateBlockMasterInput): Promise<BlockMaster> {
  return apiFetch(`/api/v1/block-master?farmId=${farmId}`, {
    method: "POST",
    body: input,
    responseSchema: BlockMasterSchema,
  });
}

export function updateBlockMaster(farmId: string, id: string, input: UpdateBlockMasterInput): Promise<BlockMaster> {
  return apiFetch(`/api/v1/block-master/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: BlockMasterSchema,
  });
}

export function deleteBlockMaster(farmId: string, id: string): Promise<void> {
  return apiFetch(`/api/v1/block-master/${id}?farmId=${farmId}`, { method: "DELETE" });
}
