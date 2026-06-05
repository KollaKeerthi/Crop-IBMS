import { apiFetch } from "@/lib/api/client";
import {
  SubBlockSchema,
  SubBlocksResponseSchema,
  type CreateSubBlockInput,
  type UpdateSubBlockInput,
  type SubBlock,
} from "./schema";

export function listSubBlocks(blockId: string, farmId: string): Promise<SubBlock[]> {
  return apiFetch(`/api/v1/locations/sub-blocks?blockId=${blockId}&farmId=${farmId}`, {
    responseSchema: SubBlocksResponseSchema,
  });
}

export function createSubBlock(input: CreateSubBlockInput): Promise<SubBlock> {
  return apiFetch("/api/v1/locations/sub-blocks", {
    method: "POST",
    body: input,
    responseSchema: SubBlockSchema,
  });
}

export function updateSubBlock(
  id: string,
  farmId: string,
  input: UpdateSubBlockInput
): Promise<SubBlock> {
  return apiFetch(`/api/v1/locations/sub-blocks/${id}?farmId=${farmId}`, {
    method: "PATCH",
    body: input,
    responseSchema: SubBlockSchema,
  });
}

export function deleteSubBlock(id: string, farmId: string): Promise<void> {
  return apiFetch(`/api/v1/locations/sub-blocks/${id}?farmId=${farmId}`, { method: "DELETE" });
}
