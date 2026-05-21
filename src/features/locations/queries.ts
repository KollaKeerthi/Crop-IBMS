import { eq, and, count } from "drizzle-orm";
import { db } from "@/db";
import { fields, greenhouses, blocks } from "@/db/schema";
import { listSubBlocks } from "@/features/sub-blocks/queries";
import type { Field, Greenhouse, Block, FieldWithBlocks, GreenhouseWithBlocks, LocationHierarchy } from "./schema";

// ── Row mappers ───────────────────────────────────────────────────────────────

type FieldRow = typeof fields.$inferSelect;
type GreenhouseRow = typeof greenhouses.$inferSelect;
type BlockRow = typeof blocks.$inferSelect;

function toField(row: FieldRow): Field {
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    areaSqm: row.areaSqm ?? null,
    noOfBlocks: row.noOfBlocks ?? 0,
    notes: row.notes ?? null,
    boundary: row.boundary ?? null,
    boundaryPolygon: row.boundary ?? null,
    boundary_polygon: row.boundary ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toGreenhouse(row: GreenhouseRow): Greenhouse {
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    areaSqm: row.areaSqm ?? null,
    notes: row.notes ?? null,
    boundary: row.boundary ?? null,
    boundaryPolygon: row.boundary ?? null,
    boundary_polygon: row.boundary ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toBlock(row: BlockRow): Block {
  return {
    id: row.id,
    farmId: row.farmId,
    parentType: row.parentType,
    parentId: row.parentId,
    name: row.name,
    areaSqm: row.areaSqm ?? null,
    notes: row.notes ?? null,
    boundary: row.boundary ?? null,
    boundaryPolygon: row.boundary ?? null,
    boundary_polygon: row.boundary ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ── Fields ────────────────────────────────────────────────────────────────────

export async function listFields(farmId: string): Promise<Field[]> {
  const rows = await db
    .select()
    .from(fields)
    .where(eq(fields.farmId, farmId))
    .orderBy(fields.name);
  return rows.map(toField);
}

export async function getFieldById(id: string, farmId: string): Promise<Field | null> {
  const [row] = await db
    .select()
    .from(fields)
    .where(and(eq(fields.id, id), eq(fields.farmId, farmId)));
  return row ? toField(row) : null;
}

// ── Greenhouses ───────────────────────────────────────────────────────────────

export async function listGreenhouses(farmId: string): Promise<Greenhouse[]> {
  const rows = await db
    .select()
    .from(greenhouses)
    .where(eq(greenhouses.farmId, farmId))
    .orderBy(greenhouses.name);
  return rows.map(toGreenhouse);
}

export async function getGreenhouseById(id: string, farmId: string): Promise<Greenhouse | null> {
  const [row] = await db
    .select()
    .from(greenhouses)
    .where(and(eq(greenhouses.id, id), eq(greenhouses.farmId, farmId)));
  return row ? toGreenhouse(row) : null;
}

export async function countExistingLocations(farmId: string): Promise<number> {
  const [fieldCount, greenhouseCount] = await Promise.all([
    db.select({ value: count() }).from(fields).where(eq(fields.farmId, farmId)),
    db.select({ value: count() }).from(greenhouses).where(eq(greenhouses.farmId, farmId)),
  ]);

  return (fieldCount[0]?.value ?? 0) + (greenhouseCount[0]?.value ?? 0);
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export async function listBlocks(
  farmId: string,
  parentId?: string,
  parentType?: "field" | "greenhouse"
): Promise<Block[]> {
  const conditions = [eq(blocks.farmId, farmId)];
  if (parentId) conditions.push(eq(blocks.parentId, parentId));
  if (parentType) conditions.push(eq(blocks.parentType, parentType));

  const rows = await db
    .select()
    .from(blocks)
    .where(and(...conditions))
    .orderBy(blocks.name);
  return rows.map(toBlock);
}

export async function getBlockById(id: string, farmId: string): Promise<Block | null> {
  const [row] = await db
    .select()
    .from(blocks)
    .where(and(eq(blocks.id, id), eq(blocks.farmId, farmId)));
  return row ? toBlock(row) : null;
}

// ── Hierarchy ─────────────────────────────────────────────────────────────────

export async function listLocationHierarchy(farmId: string): Promise<LocationHierarchy> {
  const [allFields, allGreenhouses, allBlocks] = await Promise.all([
    listFields(farmId),
    listGreenhouses(farmId),
    listBlocks(farmId),
  ]);

  // Fetch sub-blocks for all blocks in parallel
  const subBlockResults = await Promise.all(
    allBlocks.map((block) => listSubBlocks(block.id))
  );
  const subBlockMap = new Map(
    allBlocks.map((block, i) => [block.id, subBlockResults[i]])
  );

  const fieldBlockMap = new Map<string, Block[]>();
  const greenhouseBlockMap = new Map<string, Block[]>();

  for (const block of allBlocks) {
    const blockWithSubs: Block = { ...block, subBlocks: subBlockMap.get(block.id) ?? [] };
    if (block.parentType === "field") {
      const existing = fieldBlockMap.get(block.parentId) ?? [];
      existing.push(blockWithSubs);
      fieldBlockMap.set(block.parentId, existing);
    } else {
      const existing = greenhouseBlockMap.get(block.parentId) ?? [];
      existing.push(blockWithSubs);
      greenhouseBlockMap.set(block.parentId, existing);
    }
  }

  const fieldsWithBlocks: FieldWithBlocks[] = allFields.map((f) => ({
    ...f,
    blocks: fieldBlockMap.get(f.id) ?? [],
  }));

  const greenhousesWithBlocks: GreenhouseWithBlocks[] = allGreenhouses.map((g) => ({
    ...g,
    blocks: greenhouseBlockMap.get(g.id) ?? [],
  }));

  return { fields: fieldsWithBlocks, greenhouses: greenhousesWithBlocks };
}
