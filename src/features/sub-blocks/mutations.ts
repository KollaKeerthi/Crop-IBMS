import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subBlocks } from "@/db/schema";
import type { CreateSubBlockInput, UpdateSubBlockInput, SubBlock } from "./schema";
import { getSubBlockById } from "./queries";

export async function insertSubBlock(input: CreateSubBlockInput): Promise<SubBlock | null> {
  const [row] = await db
    .insert(subBlocks)
    .values({
      blockId: input.blockId,
      name: input.name,
      rows: input.rows ?? null,
      rowLengthM: input.rowLengthM ?? null,
      rowWidthM: input.rowWidthM ?? null,
      areaSqm: input.areaSqm ?? null,
      suitableCrops: input.suitableCrops ?? null,
      boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon ?? null,
    })
    .returning();

  if (!row) return null;
  return getSubBlockById(row.id);
}

export async function updateSubBlock(
  id: string,
  input: UpdateSubBlockInput
): Promise<SubBlock | null> {
  await db
    .update(subBlocks)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.rows !== undefined && { rows: input.rows }),
      ...(input.rowLengthM !== undefined && { rowLengthM: input.rowLengthM }),
      ...(input.rowWidthM !== undefined && { rowWidthM: input.rowWidthM }),
      ...(input.areaSqm !== undefined && { areaSqm: input.areaSqm }),
      ...(input.suitableCrops !== undefined && { suitableCrops: input.suitableCrops }),
      ...((input.boundary !== undefined || input.boundaryPolygon !== undefined || input.boundary_polygon !== undefined) && {
        boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon,
      }),
    })
    .where(eq(subBlocks.id, id));

  return getSubBlockById(id);
}

export async function deleteSubBlock(id: string): Promise<void> {
  await db.delete(subBlocks).where(eq(subBlocks.id, id));
}
