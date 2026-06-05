import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subBlocks } from "@/db/schema";
import type { SubBlock } from "./schema";

type SubBlockRow = typeof subBlocks.$inferSelect;

function toSubBlock(row: SubBlockRow): SubBlock {
  return {
    id: row.id,
    blockId: row.blockId,
    name: row.name,
    rows: row.rows ?? null,
    rowLengthM: row.rowLengthM ?? null,
    rowWidthM: row.rowWidthM ?? null,
    areaSqm: row.areaSqm ?? null,
    suitableCrops: (row.suitableCrops as string[] | null) ?? null,
    boundary: row.boundary ?? null,
    boundaryPolygon: row.boundary ?? null,
    boundary_polygon: row.boundary ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSubBlocks(blockId: string): Promise<SubBlock[]> {
  const rows = await db
    .select()
    .from(subBlocks)
    .where(eq(subBlocks.blockId, blockId))
    .orderBy(subBlocks.name);
  return rows.map(toSubBlock);
}

export async function getSubBlockById(id: string): Promise<SubBlock | null> {
  const [row] = await db.select().from(subBlocks).where(eq(subBlocks.id, id));
  return row ? toSubBlock(row) : null;
}
