import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listBlockMaster, getBlockById } from "./queries";
import { insertBlock, updateBlock, deleteBlock } from "./mutations";
import type { CreateBlockMasterInput, UpdateBlockMasterInput, BlockMaster } from "./schema";
import { assertBlockCanDelete } from "@/features/crop-information/delete-guards";

export async function listBlockMasterHandler(
  ctx: ApiContext,
  farmId: string
): Promise<BlockMaster[]> {
  return listBlockMaster(farmId);
}

export async function getBlockHandler(
  ctx: ApiContext,
  blockId: string,
  farmId: string
): Promise<BlockMaster> {
  const block = await getBlockById(blockId, farmId);
  if (!block) throw new ApiError(404, "not_found", "Block not found.");
  return block;
}

export async function createBlockHandler(
  ctx: ApiContext,
  farmId: string,
  input: CreateBlockMasterInput
): Promise<BlockMaster> {
  const block = await insertBlock(farmId, input);
  if (!block) throw new ApiError(500, "internal_error", "Could not create block.");

  log.info({ userId: ctx.userId, farmId, blockId: block.id }, "block_master.created");
  await logAudit({
    userId: ctx.userId,
    action: "block_master.created",
    resource: block.id,
    metadata: { blockName: input.blockName, farmId },
    newValue: block,
  });

  return block;
}

export async function updateBlockHandler(
  ctx: ApiContext,
  blockId: string,
  farmId: string,
  input: UpdateBlockMasterInput
): Promise<BlockMaster> {
  const existing = await getBlockById(blockId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Block not found.");

  const updated = await updateBlock(blockId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update block.");

  log.info({ userId: ctx.userId, blockId }, "block_master.updated");
  await logAudit({
    userId: ctx.userId,
    action: "block_master.updated",
    resource: blockId,
    previousValue: existing,
    newValue: updated,
  });

  return updated;
}

export async function deleteBlockHandler(
  ctx: ApiContext,
  blockId: string,
  farmId: string
): Promise<void> {
  const existing = await getBlockById(blockId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Block not found.");

  await assertBlockCanDelete(blockId, farmId);
  await deleteBlock(blockId, farmId);

  log.info({ userId: ctx.userId, blockId }, "block_master.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "block_master.deleted",
    resource: blockId,
    previousValue: existing,
  });
}
