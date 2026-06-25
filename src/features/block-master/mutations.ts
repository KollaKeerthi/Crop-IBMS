import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { blockMaster } from "@/db/schema";
import type { CreateBlockMasterInput, UpdateBlockMasterInput, BlockMaster } from "./schema";
import { getBlockById } from "./queries";

export async function insertBlock(
  farmId: string,
  input: CreateBlockMasterInput
): Promise<BlockMaster | null> {
  const [row] = await db
    .insert(blockMaster)
    .values({
      farmId,
      blockName: input.blockName,
      subBlockName: input.subBlockName ?? null,
      areaSqm: input.areaSqm ?? null,
      rows: input.rows ?? null,
      rowLengthM: input.rowLengthM ?? null,
      rowWidthM: input.rowWidthM ?? null,
      plantingOrder: input.plantingOrder ?? "left-right",
      nextRowOrder: input.nextRowOrder ?? "top-bottom",
      fieldId: input.fieldId ?? null,
      greenhouseId: input.greenhouseId ?? null,
      suitableCrops: input.suitableCrops ?? null,
      useInPlanning: input.useInPlanning ?? true,
      notes: input.notes ?? null,
    })
    .returning();

  if (!row) return null;
  return getBlockById(row.id, farmId);
}

export async function updateBlock(
  blockId: string,
  farmId: string,
  input: UpdateBlockMasterInput
): Promise<BlockMaster | null> {
  await db
    .update(blockMaster)
    .set({
      ...(input.blockName !== undefined && { blockName: input.blockName }),
      ...(input.subBlockName !== undefined && { subBlockName: input.subBlockName }),
      ...(input.areaSqm !== undefined && { areaSqm: input.areaSqm }),
      ...(input.rows !== undefined && { rows: input.rows }),
      ...(input.rowLengthM !== undefined && { rowLengthM: input.rowLengthM }),
      ...(input.rowWidthM !== undefined && { rowWidthM: input.rowWidthM }),
      ...(input.plantingOrder !== undefined && { plantingOrder: input.plantingOrder }),
      ...(input.nextRowOrder !== undefined && { nextRowOrder: input.nextRowOrder }),
      ...(input.fieldId !== undefined && { fieldId: input.fieldId }),
      ...(input.greenhouseId !== undefined && { greenhouseId: input.greenhouseId }),
      ...(input.suitableCrops !== undefined && { suitableCrops: input.suitableCrops }),
      ...(input.useInPlanning !== undefined && { useInPlanning: input.useInPlanning }),
      ...(input.notes !== undefined && { notes: input.notes }),
      updatedAt: new Date(),
    })
    .where(and(eq(blockMaster.id, blockId), eq(blockMaster.farmId, farmId)));

  return getBlockById(blockId, farmId);
}

export async function deleteBlock(blockId: string, farmId: string): Promise<void> {
  await db
    .delete(blockMaster)
    .where(and(eq(blockMaster.id, blockId), eq(blockMaster.farmId, farmId)));
}
