import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { blockMaster } from "@/db/schema";
import type { BlockMaster } from "./schema";

type BlockRow = typeof blockMaster.$inferSelect;

function toBlock(row: BlockRow): BlockMaster {
  return {
    id: row.id,
    farmId: row.farmId,
    blockName: row.blockName,
    subBlockName: row.subBlockName ?? null,
    areaSqm: row.areaSqm ?? null,
    rows: row.rows ?? null,
    rowLengthM: row.rowLengthM ?? null,
    rowWidthM: row.rowWidthM ?? null,
    plantingOrder:
      row.plantingOrder === "top-bottom" ||
      row.plantingOrder === "bottom-top" ||
      row.plantingOrder === "right-left"
        ? row.plantingOrder
        : "left-right",
    nextRowOrder:
      row.nextRowOrder === "bottom-top" ||
      row.nextRowOrder === "left-right" ||
      row.nextRowOrder === "right-left"
        ? row.nextRowOrder
        : "top-bottom",
    fieldId: row.fieldId ?? null,
    greenhouseId: row.greenhouseId ?? null,
    suitableCrops: (row.suitableCrops as BlockMaster["suitableCrops"]) ?? null,
    useInPlanning: row.useInPlanning,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBlockMaster(farmId: string): Promise<BlockMaster[]> {
  const rows = await db
    .select()
    .from(blockMaster)
    .where(eq(blockMaster.farmId, farmId))
    .orderBy(blockMaster.blockName);
  return rows.map(toBlock);
}

export async function getBlockById(blockId: string, farmId: string): Promise<BlockMaster | null> {
  const [row] = await db
    .select()
    .from(blockMaster)
    .where(and(eq(blockMaster.id, blockId), eq(blockMaster.farmId, farmId)));
  return row ? toBlock(row) : null;
}
