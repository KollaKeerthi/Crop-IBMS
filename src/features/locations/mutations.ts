import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { fields, greenhouses, blocks } from "@/db/schema";
import type {
  CreateFieldInput,
  UpdateFieldInput,
  Field,
  CreateGreenhouseInput,
  UpdateGreenhouseInput,
  Greenhouse,
  CreateBlockInput,
  UpdateBlockInput,
  Block,
} from "./schema";
import { getFieldById, getGreenhouseById, getBlockById } from "./queries";

// ── Fields ────────────────────────────────────────────────────────────────────

export async function insertField(input: CreateFieldInput): Promise<Field | null> {
  const [row] = await db
    .insert(fields)
    .values({
      farmId: input.farmId,
      name: input.name,
      areaSqm: input.areaSqm ?? null,
      notes: input.notes ?? null,
      boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon ?? null,
    })
    .returning();
  if (!row) return null;
  return getFieldById(row.id, input.farmId);
}

export async function updateField(
  fieldId: string,
  farmId: string,
  input: UpdateFieldInput
): Promise<Field | null> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.areaSqm !== undefined) updates.areaSqm = input.areaSqm;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.boundary !== undefined || input.boundaryPolygon !== undefined || input.boundary_polygon !== undefined) {
    updates.boundary = input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon;
  }

  await db
    .update(fields)
    .set(updates)
    .where(and(eq(fields.id, fieldId), eq(fields.farmId, farmId)));
  return getFieldById(fieldId, farmId);
}

export async function deleteField(fieldId: string, farmId: string): Promise<void> {
  await db.delete(fields).where(and(eq(fields.id, fieldId), eq(fields.farmId, farmId)));
}

// ── Greenhouses ───────────────────────────────────────────────────────────────

export async function insertGreenhouse(input: CreateGreenhouseInput): Promise<Greenhouse | null> {
  const [row] = await db
    .insert(greenhouses)
    .values({
      farmId: input.farmId,
      name: input.name,
      areaSqm: input.areaSqm ?? null,
      notes: input.notes ?? null,
      boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon ?? null,
    })
    .returning();
  if (!row) return null;
  return getGreenhouseById(row.id, input.farmId);
}

export async function updateGreenhouse(
  greenhouseId: string,
  farmId: string,
  input: UpdateGreenhouseInput
): Promise<Greenhouse | null> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.areaSqm !== undefined) updates.areaSqm = input.areaSqm;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.boundary !== undefined || input.boundaryPolygon !== undefined || input.boundary_polygon !== undefined) {
    updates.boundary = input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon;
  }

  await db
    .update(greenhouses)
    .set(updates)
    .where(and(eq(greenhouses.id, greenhouseId), eq(greenhouses.farmId, farmId)));
  return getGreenhouseById(greenhouseId, farmId);
}

export async function deleteGreenhouse(greenhouseId: string, farmId: string): Promise<void> {
  await db
    .delete(greenhouses)
    .where(and(eq(greenhouses.id, greenhouseId), eq(greenhouses.farmId, farmId)));
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export async function insertBlock(input: CreateBlockInput): Promise<Block | null> {
  const [row] = await db
    .insert(blocks)
    .values({
      farmId: input.farmId,
      parentType: input.parentType,
      parentId: input.parentId,
      name: input.name,
      areaSqm: input.areaSqm ?? null,
      notes: input.notes ?? null,
      boundary: input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon ?? null,
    })
    .returning();

  if (!row) return null;

  if (input.parentType === "field") {
    await db
      .update(fields)
      .set({ noOfBlocks: sql`${fields.noOfBlocks} + 1` })
      .where(eq(fields.id, input.parentId));
  }

  return getBlockById(row.id, input.farmId);
}

export async function updateBlock(
  blockId: string,
  farmId: string,
  input: UpdateBlockInput
): Promise<Block | null> {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.areaSqm !== undefined) updates.areaSqm = input.areaSqm;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.boundary !== undefined || input.boundaryPolygon !== undefined || input.boundary_polygon !== undefined) {
    updates.boundary = input.boundary ?? input.boundaryPolygon ?? input.boundary_polygon;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(blocks)
      .set(updates)
      .where(and(eq(blocks.id, blockId), eq(blocks.farmId, farmId)));
  }
  return getBlockById(blockId, farmId);
}

export async function deleteBlock(blockId: string, farmId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(blocks)
    .where(and(eq(blocks.id, blockId), eq(blocks.farmId, farmId)));

  if (!row) return;

  await db.delete(blocks).where(and(eq(blocks.id, blockId), eq(blocks.farmId, farmId)));

  if (row.parentType === "field") {
    await db
      .update(fields)
      .set({ noOfBlocks: sql`GREATEST(${fields.noOfBlocks} - 1, 0)` })
      .where(eq(fields.id, row.parentId));
  }
}
