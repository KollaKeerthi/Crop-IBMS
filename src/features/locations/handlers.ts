import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { checkFarmAccess, getFarmById } from "@/features/farms/queries";
import { insertSubBlock } from "@/features/sub-blocks/mutations";
import { insertBlock as insertBlockMaster } from "@/features/block-master/mutations";
import { generateLocationGeometry, type PolygonGeometry } from "./geometry";
import {
  listFields,
  getFieldById,
  listGreenhouses,
  getGreenhouseById,
  listBlocks,
  getBlockById,
  listLocationHierarchy,
  countExistingLocations,
} from "./queries";
import {
  insertField,
  updateField,
  deleteField,
  insertGreenhouse,
  updateGreenhouse,
  deleteGreenhouse,
  insertBlock,
  updateBlock,
  deleteBlock,
} from "./mutations";
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
  LocationHierarchy,
} from "./schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertAccess(farmId: string, userId: string): Promise<void> {
  const ok = await checkFarmAccess(farmId, userId);
  if (!ok) throw new ApiError(403, "forbidden", "Access denied.");
}

function polygonCenter(geometry: unknown): { latitude: number; longitude: number } | null {
  if (
    typeof geometry !== "object" ||
    geometry === null ||
    !("type" in geometry) ||
    !("coordinates" in geometry)
  ) {
    return null;
  }

  const polygon = geometry as { type?: unknown; coordinates?: unknown };
  if (polygon.type !== "Polygon" || !Array.isArray(polygon.coordinates)) return null;

  const ring = polygon.coordinates[0];
  if (!Array.isArray(ring) || ring.length === 0) return null;

  const points = ring.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number"
  );
  if (points.length === 0) return null;

  const totals = points.reduce(
    (acc, [longitude, latitude]) => ({
      latitude: acc.latitude + latitude,
      longitude: acc.longitude + longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: totals.latitude / points.length,
    longitude: totals.longitude / points.length,
  };
}

async function resolveFarmCenter(farmId: string, userId: string) {
  const farm = await getFarmById(farmId, userId);
  if (!farm) throw new ApiError(404, "not_found", "Farm not found.");
  if (farm.latitude != null && farm.longitude != null) {
    return { latitude: farm.latitude, longitude: farm.longitude };
  }

  const center = polygonCenter(farm.boundaryPolygon ?? farm.boundary);
  if (center) return center;

  throw new ApiError(
    422,
    "validation_error",
    "Farm needs a map point or boundary before auto-generating location geometry."
  );
}

function blockNotes(block: NonNullable<CreateFieldInput["blocks"]>[number]) {
  return (
    [
      block.rows !== undefined ? `Rows: ${block.rows}` : undefined,
      block.rowLengthM !== undefined ? `Row Length (m): ${block.rowLengthM}` : undefined,
      block.rowWidthM !== undefined ? `Row Width (m): ${block.rowWidthM}` : undefined,
      block.rowSpaceM !== undefined ? `Row Space (m): ${block.rowSpaceM}` : undefined,
      block.crops ? `Crops: ${block.crops}` : undefined,
    ]
      .filter(Boolean)
      .join("\n") || undefined
  );
}

async function createGeneratedChildren({
  ctx,
  farmId,
  parentType,
  parentId,
  parentAreaSqm,
  blockInputs,
  blockPolygons,
  subBlockPolygons,
}: {
  ctx: ApiContext;
  farmId: string;
  parentType: "field" | "greenhouse";
  parentId: string;
  parentAreaSqm?: number | null;
  blockInputs: NonNullable<CreateFieldInput["blocks"]>;
  blockPolygons: PolygonGeometry[];
  subBlockPolygons: PolygonGeometry[][];
}) {
  await Promise.all(
    blockInputs.map(async (blockInput, index) => {
      const block = await insertBlock({
        farmId,
        parentType,
        parentId,
        name: blockInput.name,
        areaSqm: parentAreaSqm ? parentAreaSqm / blockInputs.length : undefined,
        notes: blockNotes(blockInput),
        boundaryPolygon: blockPolygons[index],
      });
      if (!block) throw new ApiError(500, "internal_error", "Could not create generated block.");

      await logAudit({
        userId: ctx.userId,
        action: "block.created",
        resource: block.id,
        metadata: { name: block.name, farmId, parentType, parentId, generated: true },
      });

      const subPolygons = subBlockPolygons[index] ?? [];
      await Promise.all(
        subPolygons.map(async (boundaryPolygon, subIndex) => {
          const suffix = subIndex + 1;
          const subBlock = await insertSubBlock({
            farmId,
            blockId: block.id,
            name: `${blockInput.name}.${suffix}`,
            rows: blockInput.rows,
            rowLengthM: blockInput.rowLengthM,
            rowWidthM: blockInput.rowWidthM,
            areaSqm: block.areaSqm ? block.areaSqm / subPolygons.length : undefined,
            boundaryPolygon,
          });
          if (!subBlock)
            throw new ApiError(500, "internal_error", "Could not create generated sub-block.");

          const blockMaster = await insertBlockMaster(farmId, {
            blockName: blockInput.name,
            subBlockName: subBlock.name,
            areaSqm: subBlock.areaSqm ?? undefined,
            rows: blockInput.rows,
            rowLengthM: blockInput.rowLengthM,
            rowWidthM: blockInput.rowWidthM,
            fieldId: parentType === "field" ? parentId : undefined,
            greenhouseId: parentType === "greenhouse" ? parentId : undefined,
            notes: blockNotes(blockInput),
          });
          if (!blockMaster)
            throw new ApiError(
              500,
              "internal_error",
              "Could not create generated block master row."
            );

          await logAudit({
            userId: ctx.userId,
            action: "block_master.created",
            resource: blockMaster.id,
            metadata: {
              blockName: blockInput.name,
              subBlockName: subBlock.name,
              farmId,
              generated: true,
            },
          });

          await logAudit({
            userId: ctx.userId,
            action: "sub_block.created",
            resource: subBlock.id,
            metadata: { name: subBlock.name, blockId: block.id, farmId, generated: true },
          });
        })
      );
    })
  );
}

// ── Fields ────────────────────────────────────────────────────────────────────

export async function listFieldsHandler(ctx: ApiContext, farmId: string): Promise<Field[]> {
  await assertAccess(farmId, ctx.userId);
  return listFields(farmId);
}

export async function createFieldHandler(ctx: ApiContext, input: CreateFieldInput): Promise<Field> {
  await assertAccess(input.farmId, ctx.userId);
  const blockInputs = input.blocks ?? [];
  const shouldGenerate = !input.boundary && !input.boundaryPolygon && !input.boundary_polygon;
  const offsetIndex = shouldGenerate ? await countExistingLocations(input.farmId) : 0;
  const generated = shouldGenerate
    ? generateLocationGeometry({
        ...(await resolveFarmCenter(input.farmId, ctx.userId)),
        areaSqm: input.areaSqm,
        blockCount: blockInputs.length || 1,
        offsetIndex,
      })
    : null;
  const field = await insertField({
    ...input,
    boundaryPolygon: input.boundaryPolygon ?? input.boundary_polygon ?? generated?.parent,
  });
  if (!field) throw new ApiError(500, "internal_error", "Could not create field.");

  if (blockInputs.length > 0 && generated) {
    await createGeneratedChildren({
      ctx,
      farmId: input.farmId,
      parentType: "field",
      parentId: field.id,
      parentAreaSqm: input.areaSqm,
      blockInputs,
      blockPolygons: generated.blocks,
      subBlockPolygons: generated.subBlocks,
    });
  }

  log.info(
    { userId: ctx.userId, farmId: input.farmId, fieldId: field.id },
    "locations.field_created"
  );
  await logAudit({
    userId: ctx.userId,
    action: "field.created",
    resource: field.id,
    metadata: { name: input.name, farmId: input.farmId },
  });

  return field;
}

export async function updateFieldHandler(
  ctx: ApiContext,
  fieldId: string,
  farmId: string,
  input: UpdateFieldInput
): Promise<Field> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getFieldById(fieldId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Field not found.");

  const updated = await updateField(fieldId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update field.");

  log.info({ userId: ctx.userId, fieldId }, "locations.field_updated");
  await logAudit({ userId: ctx.userId, action: "field.updated", resource: fieldId });

  return updated;
}

export async function deleteFieldHandler(
  ctx: ApiContext,
  fieldId: string,
  farmId: string
): Promise<void> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getFieldById(fieldId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Field not found.");

  await deleteField(fieldId, farmId);

  log.info({ userId: ctx.userId, fieldId }, "locations.field_deleted");
  await logAudit({ userId: ctx.userId, action: "field.deleted", resource: fieldId });
}

// ── Greenhouses ───────────────────────────────────────────────────────────────

export async function listGreenhousesHandler(
  ctx: ApiContext,
  farmId: string
): Promise<Greenhouse[]> {
  await assertAccess(farmId, ctx.userId);
  return listGreenhouses(farmId);
}

export async function createGreenhouseHandler(
  ctx: ApiContext,
  input: CreateGreenhouseInput
): Promise<Greenhouse> {
  await assertAccess(input.farmId, ctx.userId);
  const blockInputs = input.blocks ?? [];
  const shouldGenerate = !input.boundary && !input.boundaryPolygon && !input.boundary_polygon;
  const offsetIndex = shouldGenerate ? await countExistingLocations(input.farmId) : 0;
  const generated = shouldGenerate
    ? generateLocationGeometry({
        ...(await resolveFarmCenter(input.farmId, ctx.userId)),
        areaSqm: input.areaSqm,
        blockCount: blockInputs.length || 1,
        offsetIndex,
      })
    : null;
  const greenhouse = await insertGreenhouse({
    ...input,
    boundaryPolygon: input.boundaryPolygon ?? input.boundary_polygon ?? generated?.parent,
  });
  if (!greenhouse) throw new ApiError(500, "internal_error", "Could not create greenhouse.");

  if (blockInputs.length > 0 && generated) {
    await createGeneratedChildren({
      ctx,
      farmId: input.farmId,
      parentType: "greenhouse",
      parentId: greenhouse.id,
      parentAreaSqm: input.areaSqm,
      blockInputs,
      blockPolygons: generated.blocks,
      subBlockPolygons: generated.subBlocks,
    });
  }

  log.info(
    { userId: ctx.userId, farmId: input.farmId, greenhouseId: greenhouse.id },
    "locations.greenhouse_created"
  );
  await logAudit({
    userId: ctx.userId,
    action: "greenhouse.created",
    resource: greenhouse.id,
    metadata: { name: input.name, farmId: input.farmId },
  });

  return greenhouse;
}

export async function updateGreenhouseHandler(
  ctx: ApiContext,
  greenhouseId: string,
  farmId: string,
  input: UpdateGreenhouseInput
): Promise<Greenhouse> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getGreenhouseById(greenhouseId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Greenhouse not found.");

  const updated = await updateGreenhouse(greenhouseId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update greenhouse.");

  log.info({ userId: ctx.userId, greenhouseId }, "locations.greenhouse_updated");
  await logAudit({ userId: ctx.userId, action: "greenhouse.updated", resource: greenhouseId });

  return updated;
}

export async function deleteGreenhouseHandler(
  ctx: ApiContext,
  greenhouseId: string,
  farmId: string
): Promise<void> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getGreenhouseById(greenhouseId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Greenhouse not found.");

  await deleteGreenhouse(greenhouseId, farmId);

  log.info({ userId: ctx.userId, greenhouseId }, "locations.greenhouse_deleted");
  await logAudit({ userId: ctx.userId, action: "greenhouse.deleted", resource: greenhouseId });
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export async function listBlocksHandler(
  ctx: ApiContext,
  farmId: string,
  parentId?: string,
  parentType?: "field" | "greenhouse"
): Promise<Block[]> {
  await assertAccess(farmId, ctx.userId);
  return listBlocks(farmId, parentId, parentType);
}

export async function createBlockHandler(ctx: ApiContext, input: CreateBlockInput): Promise<Block> {
  await assertAccess(input.farmId, ctx.userId);
  const block = await insertBlock(input);
  if (!block) throw new ApiError(500, "internal_error", "Could not create block.");

  log.info(
    { userId: ctx.userId, farmId: input.farmId, blockId: block.id },
    "locations.block_created"
  );
  await logAudit({
    userId: ctx.userId,
    action: "block.created",
    resource: block.id,
    metadata: { name: input.name, parentType: input.parentType, parentId: input.parentId },
  });

  return block;
}

export async function updateBlockHandler(
  ctx: ApiContext,
  blockId: string,
  farmId: string,
  input: UpdateBlockInput
): Promise<Block> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getBlockById(blockId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Block not found.");

  const updated = await updateBlock(blockId, farmId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update block.");

  log.info({ userId: ctx.userId, blockId }, "locations.block_updated");
  await logAudit({ userId: ctx.userId, action: "block.updated", resource: blockId });

  return updated;
}

export async function deleteBlockHandler(
  ctx: ApiContext,
  blockId: string,
  farmId: string
): Promise<void> {
  await assertAccess(farmId, ctx.userId);
  const existing = await getBlockById(blockId, farmId);
  if (!existing) throw new ApiError(404, "not_found", "Block not found.");

  await deleteBlock(blockId, farmId);

  log.info({ userId: ctx.userId, blockId }, "locations.block_deleted");
  await logAudit({ userId: ctx.userId, action: "block.deleted", resource: blockId });
}

// ── Hierarchy ─────────────────────────────────────────────────────────────────

export async function listHierarchyHandler(
  ctx: ApiContext,
  farmId: string
): Promise<LocationHierarchy> {
  await assertAccess(farmId, ctx.userId);
  return listLocationHierarchy(farmId);
}
