import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { checkFarmAccess } from "@/features/farms/queries";
import { listSubBlocks, getSubBlockById } from "./queries";
import { insertSubBlock, updateSubBlock, deleteSubBlock } from "./mutations";
import type { CreateSubBlockInput, UpdateSubBlockInput, SubBlock } from "./schema";

async function assertAccess(farmId: string, userId: string): Promise<void> {
  const ok = await checkFarmAccess(farmId, userId);
  if (!ok) throw new ApiError(403, "forbidden", "Access denied.");
}

export async function listSubBlocksHandler(
  ctx: ApiContext,
  farmId: string,
  blockId: string
): Promise<SubBlock[]> {
  await assertAccess(farmId, ctx.userId);
  return listSubBlocks(blockId);
}

export async function getSubBlockHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<SubBlock> {
  await assertAccess(farmId, ctx.userId);
  const subBlock = await getSubBlockById(id);
  if (!subBlock) throw new ApiError(404, "not_found", "Sub-block not found.");
  return subBlock;
}

export async function createSubBlockHandler(
  ctx: ApiContext,
  input: CreateSubBlockInput
): Promise<SubBlock> {
  await assertAccess(input.farmId, ctx.userId);
  const subBlock = await insertSubBlock(input);
  if (!subBlock) throw new ApiError(500, "internal_error", "Could not create sub-block.");

  log.info(
    { userId: ctx.userId, blockId: input.blockId, subBlockId: subBlock.id },
    "sub_blocks.created"
  );
  await logAudit({
    userId: ctx.userId,
    action: "sub_block.created",
    resource: subBlock.id,
    metadata: { name: input.name, blockId: input.blockId, farmId: input.farmId },
  });

  return subBlock;
}

export async function updateSubBlockHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateSubBlockInput
): Promise<SubBlock> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getSubBlockById(id);
  if (!existing) throw new ApiError(404, "not_found", "Sub-block not found.");

  const updated = await updateSubBlock(id, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update sub-block.");

  log.info({ userId: ctx.userId, subBlockId: id }, "sub_blocks.updated");
  await logAudit({ userId: ctx.userId, action: "sub_block.updated", resource: id });

  return updated;
}

export async function deleteSubBlockHandler(
  ctx: ApiContext,
  id: string,
  farmId: string
): Promise<void> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getSubBlockById(id);
  if (!existing) throw new ApiError(404, "not_found", "Sub-block not found.");

  await deleteSubBlock(id);

  log.info({ userId: ctx.userId, subBlockId: id }, "sub_blocks.deleted");
  await logAudit({ userId: ctx.userId, action: "sub_block.deleted", resource: id });
}
