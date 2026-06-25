import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import type { ApiContext } from "@/lib/api/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  farmMemberships,
  cropData,
  cropDataModules,
  cropVarieties,
  cropTypes,
  crops,
  contracts,
  blockMaster,
  blocks as locationBlocks,
} from "@/db/schema";
import {
  listCropData,
  getCropDataById,
  getProgramInfo,
  getNursery,
  getRevenue,
  getSectionRow,
  listCollectionRows,
  listMedia,
  getMediaById,
  getAllModules,
} from "./queries";
import {
  createCropDataRecord,
  updateCropDataRecord,
  deleteCropDataRecord,
  upsertProgramInfo,
  upsertNursery,
  upsertRevenue,
  upsertSectionRow,
  insertCollectionRow,
  updateCollectionRow,
  deleteCollectionRow,
  insertMedia,
  deleteMedia,
  upsertModule,
} from "./mutations";
import { getSectionConfig, SECTION_REGISTRY } from "./sections";
import { getCollectionConfig, COLLECTION_REGISTRY } from "./collections";
import type {
  CreateCropDataInput,
  UpdateCropDataInput,
  UpdateProgramInfoInput,
  UpdateNurseryInput,
  UpdateRevenueInput,
  UpdateModuleInput,
} from "./schema";

async function verifyFarmAccess(userId: string, farmId: string) {
  const rows = await db
    .select()
    .from(farmMemberships)
    .where(and(eq(farmMemberships.userId, userId), eq(farmMemberships.farmId, farmId)))
    .limit(1);
  if (!rows[0]) throw new ApiError(403, "forbidden", "You do not have access to this farm.");
}

async function validateCropLinks(input: {
  cropId?: string | null;
  cropTypeId?: string | null;
  varietyId?: string | null;
}) {
  if (input.cropTypeId && input.cropId) {
    const [type] = await db
      .select({ id: cropTypes.id, cropId: cropTypes.cropId })
      .from(cropTypes)
      .where(eq(cropTypes.id, input.cropTypeId))
      .limit(1);
    if (!type || type.cropId !== input.cropId)
      throw new ApiError(
        400,
        "invalid_crop_type",
        "Crop type does not belong to the selected crop."
      );
  }
  if (input.varietyId && input.cropId) {
    const [variety] = await db
      .select({ id: cropVarieties.id, cropId: cropVarieties.cropId })
      .from(cropVarieties)
      .where(eq(cropVarieties.id, input.varietyId))
      .limit(1);
    if (!variety || variety.cropId !== input.cropId)
      throw new ApiError(400, "invalid_variety", "Variety does not belong to the selected crop.");
  }
}

async function validateLocationBlock(farmId: string, locationBlockId?: string | null) {
  if (!locationBlockId) return;
  const [block] = await db
    .select({ id: locationBlocks.id })
    .from(locationBlocks)
    .where(and(eq(locationBlocks.id, locationBlockId), eq(locationBlocks.farmId, farmId)))
    .limit(1);
  if (!block) {
    throw new ApiError(400, "invalid_location_block", "Block does not belong to this farm.");
  }
}

async function validateContract(farmId: string, contractId?: string | null) {
  if (!contractId) return;
  const [contract] = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.farmId, farmId)))
    .limit(1);
  if (!contract) {
    throw new ApiError(400, "invalid_contract", "Contract does not belong to this farm.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function stringFrom(value: unknown) {
  return typeof value === "string" ? value : null;
}

function plantingEntries(data: unknown) {
  if (!isRecord(data)) return [];
  const raw = Array.isArray(data.entries)
    ? data.entries
    : Array.isArray(data.rows)
      ? data.rows
      : [];
  return raw.filter(isRecord);
}

function periodStart(contract: {
  materialArrivalWeek: number | null;
  plantingWeek: number | null;
  pollinationStartWeek: number | null;
}) {
  return contract.materialArrivalWeek ?? contract.plantingWeek ?? contract.pollinationStartWeek;
}

function overlaps(
  left: { year: number; start: number; end: number },
  right: { year: number; start: number; end: number }
) {
  return left.year === right.year && left.start <= right.end && right.start <= left.end;
}

async function validatePlantingModule(cropDataId: string, farmId: string, data: unknown) {
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  if (!record.contractId) {
    throw new ApiError(
      400,
      "missing_contract",
      "Link this crop data record to a contract before saving planting rows."
    );
  }

  const [contract] = await db
    .select({
      id: contracts.id,
      year: contracts.year,
      materialArrivalWeek: contracts.materialArrivalWeek,
      plantingWeek: contracts.plantingWeek,
      pollinationStartWeek: contracts.pollinationStartWeek,
      endWeek: contracts.endWeek,
      absContractNo: contracts.absContractNo,
      contractRef: contracts.contractRef,
      blockId: contracts.blockId,
      blockRows: blockMaster.rows,
      blockName: blockMaster.blockName,
    })
    .from(contracts)
    .leftJoin(blockMaster, eq(blockMaster.id, contracts.blockId))
    .where(and(eq(contracts.id, record.contractId), eq(contracts.farmId, farmId)))
    .limit(1);

  const start = contract ? periodStart(contract) : null;
  if (!contract || !contract.blockId || start == null || contract.endWeek == null) {
    throw new ApiError(
      400,
      "incomplete_contract_period",
      "The linked contract needs a block, start week, and end week before planting rows can be saved."
    );
  }

  const maxRows = contract.blockRows;
  const entries = plantingEntries(data);
  for (const entry of entries) {
    const rowNo = numberFrom(entry.rowNo ?? entry.rowNumber);
    if (!rowNo || rowNo < 1 || !Number.isInteger(rowNo)) {
      throw new ApiError(
        400,
        "invalid_row_number",
        "Each planting detail row needs a valid row number."
      );
    }
    if (maxRows && rowNo > maxRows) {
      throw new ApiError(
        400,
        "row_exceeds_block_limit",
        `Row ${rowNo} is outside ${contract.blockName ?? "the selected block"}, which has ${maxRows} rows.`
      );
    }
  }

  const rowsUsed = new Set(entries.map((entry) => numberFrom(entry.rowNo ?? entry.rowNumber)));
  if (rowsUsed.size === 0) return;

  const currentPeriod = { year: contract.year, start, end: contract.endWeek };
  const otherRows = await db
    .select({
      cropDataId: cropData.id,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      contractNo: cropData.contractNo,
      contractAbsNo: contracts.absContractNo,
      contractRef: contracts.contractRef,
      year: contracts.year,
      materialArrivalWeek: contracts.materialArrivalWeek,
      plantingWeek: contracts.plantingWeek,
      pollinationStartWeek: contracts.pollinationStartWeek,
      endWeek: contracts.endWeek,
      moduleData: cropDataModules.data,
    })
    .from(cropData)
    .innerJoin(contracts, eq(contracts.id, cropData.contractId))
    .innerJoin(
      cropDataModules,
      and(
        eq(cropDataModules.cropDataId, cropData.id),
        eq(cropDataModules.moduleType, "planting_records")
      )
    )
    .leftJoin(crops, eq(crops.id, cropData.cropId))
    .leftJoin(cropVarieties, eq(cropVarieties.id, cropData.varietyId))
    .where(
      and(
        eq(cropData.farmId, farmId),
        eq(contracts.blockId, contract.blockId),
        eq(cropData.status, "active")
      )
    );

  for (const other of otherRows) {
    if (other.cropDataId === cropDataId) continue;
    const otherStart = periodStart(other);
    if (otherStart == null || other.endWeek == null) continue;
    if (!overlaps(currentPeriod, { year: other.year, start: otherStart, end: other.endWeek })) {
      continue;
    }
    for (const entry of plantingEntries(other.moduleData)) {
      const rowNo = numberFrom(entry.rowNo ?? entry.rowNumber);
      if (!rowNo || !rowsUsed.has(rowNo)) continue;
      const crop = stringFrom(entry.crop) ?? other.cropName ?? "another crop";
      const variety =
        stringFrom(entry.cropVariety ?? entry.variety) ?? other.varietyName ?? "unknown variety";
      const gender = stringFrom(entry.gender ?? entry.type) ?? "unknown gender";
      const ref = other.contractAbsNo ?? other.contractNo ?? other.contractRef ?? "linked contract";
      throw new ApiError(
        409,
        "row_already_used",
        `Row ${rowNo} is already used by ${crop} / ${variety} / ${gender} for ${ref}.`
      );
    }
  }
}

export async function listCropDataHandler(ctx: ApiContext, farmId: string) {
  await verifyFarmAccess(ctx.userId, farmId);
  return listCropData(farmId);
}

export async function getCropDataHandler(ctx: ApiContext, id: string, farmId: string) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(id, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const sectionKeys = Object.keys(SECTION_REGISTRY);
  const collectionKeys = Object.keys(COLLECTION_REGISTRY);
  const [pi, nurs, rev, modules, media, ...rest] = await Promise.all([
    getProgramInfo(id),
    getNursery(id),
    getRevenue(id),
    getAllModules(id),
    listMedia(id),
    ...sectionKeys.map((key) => getSectionRow(SECTION_REGISTRY[key]!.table, id)),
    ...collectionKeys.map((key) => listCollectionRows(COLLECTION_REGISTRY[key]!.table, id)),
  ]);
  const sectionRows = rest.slice(0, sectionKeys.length);
  const collectionRows = rest.slice(sectionKeys.length);
  const sections: Record<string, unknown> = {};
  sectionKeys.forEach((key, i) => {
    sections[key] = sectionRows[i];
  });
  const collections: Record<string, unknown> = {};
  collectionKeys.forEach((key, i) => {
    collections[key] = collectionRows[i];
  });
  return {
    ...record,
    programInfo: pi,
    nursery: nurs,
    revenue: rev,
    sections,
    collections,
    media,
    modules,
  };
}

export async function createCropDataHandler(ctx: ApiContext, input: CreateCropDataInput) {
  await verifyFarmAccess(ctx.userId, input.farmId);
  await validateCropLinks(input);
  await validateLocationBlock(input.farmId, input.locationBlockId);
  await validateContract(input.farmId, input.contractId);
  const record = await createCropDataRecord(input);
  await logAudit({
    userId: ctx.userId,
    farmId: input.farmId,
    action: "crop_data.created",
    resource: record.id,
    newData: {
      cropId: record.cropId,
      cropTypeId: record.cropTypeId,
      varietyId: record.varietyId,
      status: record.status,
    } as Record<string, unknown>,
  });
  return record;
}

export async function updateCropDataHandler(
  ctx: ApiContext,
  id: string,
  farmId: string,
  input: UpdateCropDataInput
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(id, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  // Resolve effective cropId for FK validation (use input value or fall back to existing)
  const effectiveCropId = input.cropId ?? record.cropId;
  await validateCropLinks({
    cropId: effectiveCropId,
    cropTypeId: input.cropTypeId,
    varietyId: input.varietyId,
  });
  await validateLocationBlock(farmId, input.locationBlockId);
  await validateContract(farmId, input.contractId);
  const updated = await updateCropDataRecord(id, input);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.updated",
    resource: id,
    previousData: {
      cropId: record.cropId,
      cropTypeId: record.cropTypeId,
      varietyId: record.varietyId,
      status: record.status,
    } as Record<string, unknown>,
    newData: {
      cropId: updated?.cropId,
      cropTypeId: updated?.cropTypeId,
      varietyId: updated?.varietyId,
      status: updated?.status,
    } as Record<string, unknown>,
  });
  return updated;
}

export async function deleteCropDataHandler(ctx: ApiContext, id: string, farmId: string) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(id, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  await deleteCropDataRecord(id);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.deleted",
    resource: id,
    previousData: {
      cropId: record.cropId,
      cropTypeId: record.cropTypeId,
      varietyId: record.varietyId,
      status: record.status,
    } as Record<string, unknown>,
  });
}

export async function updateProgramInfoHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  input: UpdateProgramInfoInput
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  return upsertProgramInfo(cropDataId, input);
}

export async function updateNurseryHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  input: UpdateNurseryInput
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  return upsertNursery(cropDataId, input);
}

export async function updateRevenueHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  input: UpdateRevenueInput
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  return upsertRevenue(cropDataId, input);
}

export async function updateSectionHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  section: string,
  input: Record<string, unknown>
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const config = getSectionConfig(section);
  if (!config) throw new ApiError(404, "not_found", "Unknown section.");
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const result = await upsertSectionRow(config.table, cropDataId, input, config.dateFields);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.section_updated",
    resource: cropDataId,
    metadata: { section },
    newData: input,
  });
  return result;
}

export async function createCollectionRowHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  collection: string,
  input: Record<string, unknown>
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const config = getCollectionConfig(collection);
  if (!config) throw new ApiError(404, "not_found", "Unknown collection.");
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const row = await insertCollectionRow(config.table, cropDataId, input, config.dateFields);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.collection_row_created",
    resource: (row as { id: string }).id,
    metadata: { collection, cropDataId },
    newData: input,
  });
  return row;
}

export async function updateCollectionRowHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  collection: string,
  rowId: string,
  input: Record<string, unknown>
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const config = getCollectionConfig(collection);
  if (!config) throw new ApiError(404, "not_found", "Unknown collection.");
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const updated = await updateCollectionRow(
    config.table,
    cropDataId,
    rowId,
    input,
    config.dateFields
  );
  if (!updated) throw new ApiError(404, "not_found", "Row not found.");
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.collection_row_updated",
    resource: rowId,
    metadata: { collection, cropDataId },
    newData: input,
  });
  return updated;
}

export async function deleteCollectionRowHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  collection: string,
  rowId: string
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const config = getCollectionConfig(collection);
  if (!config) throw new ApiError(404, "not_found", "Unknown collection.");
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  await deleteCollectionRow(config.table, cropDataId, rowId);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.collection_row_deleted",
    resource: rowId,
    metadata: { collection, cropDataId },
  });
}

export async function addMediaHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  input: {
    url: string;
    cloudinaryId?: string | null;
    teedyDocumentId?: string | null;
    teedyFileId?: string | null;
    name?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const media = await insertMedia({ entityId: cropDataId, uploadedBy: ctx.userId, ...input });
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.media_added",
    resource: (media as { id: string }).id,
    resourceName: input.name ?? null,
    metadata: { cropDataId, mimeType: input.mimeType, sizeBytes: input.sizeBytes },
  });
  return media;
}

export async function deleteMediaHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  mediaId: string
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const media = await getMediaById(mediaId, cropDataId);
  if (!media) throw new ApiError(404, "not_found", "Attachment not found.");
  await deleteMedia(mediaId, cropDataId);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.media_deleted",
    resource: mediaId,
    resourceName: (media as { name?: string }).name ?? null,
    metadata: { cropDataId },
  });
  return media;
}

export async function getMediaDownloadHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  mediaId: string
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  const media = await getMediaById(mediaId, cropDataId);
  if (!media) throw new ApiError(404, "not_found", "Attachment not found.");
  return media;
}

export async function updateModuleHandler(
  ctx: ApiContext,
  cropDataId: string,
  farmId: string,
  moduleType: string,
  input: UpdateModuleInput
) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  if (moduleType === "planting_records") {
    await validatePlantingModule(cropDataId, farmId, input.data);
  }
  const result = await upsertModule(cropDataId, moduleType, input.data);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.module_updated",
    resource: cropDataId,
    metadata: { moduleType },
    newData: input.data as Record<string, unknown>,
  });
  return result;
}
