import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import type { ApiContext } from "@/lib/api/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  farmMemberships,
  cropData,
  cropDataAllocationSegments,
  cropVarieties,
  cropTypes,
  crops,
  contracts,
  reservations,
  blockMaster,
  blocks as locationBlocks,
  densityMaster,
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
  replaceAllocationSegments,
  type AllocationSegmentInput,
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

async function validateContract(
  farmId: string,
  contractId?: string | null,
  options: { required?: boolean } = {}
) {
  if (!contractId) {
    if (!options.required) return null;
    throw new ApiError(400, "missing_contract", "Contract Ref Number is required.");
  }
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.farmId, farmId)))
    .limit(1);
  if (!contract) {
    throw new ApiError(400, "invalid_contract", "Contract does not belong to this farm.");
  }
  if (contract.status === "completed") {
    throw new ApiError(
      400,
      "completed_contract",
      "Completed contracts cannot create new programs."
    );
  }
  return contract;
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

function positiveIntFrom(value: unknown) {
  const parsed = numberFrom(value);
  return parsed && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function weekStart(contract: {
  materialArrivalWeek: number | null;
  plantingWeek: number | null;
  pollinationStartWeek: number | null;
}) {
  return contract.materialArrivalWeek ?? contract.plantingWeek ?? contract.pollinationStartWeek;
}

function periodRange(contract: {
  year: number;
  materialArrivalWeek: number | null;
  plantingWeek: number | null;
  pollinationStartWeek: number | null;
  endWeek: number | null;
}) {
  const start = weekStart(contract);
  if (start == null || contract.endWeek == null) return null;
  const startOrdinal = contract.year * 53 + start;
  let endOrdinal = contract.year * 53 + contract.endWeek;
  if (endOrdinal < startOrdinal) endOrdinal += 53;
  return {
    year: contract.year,
    startWeek: start,
    endWeek: contract.endWeek,
    startOrdinal,
    endOrdinal,
  };
}

function rangesOverlap(
  left: { startOrdinal: number; endOrdinal: number },
  right: { startOrdinal: number; endOrdinal: number }
) {
  return left.startOrdinal <= right.endOrdinal && right.startOrdinal <= left.endOrdinal;
}

function plantRangesOverlap(
  left: { startPlantNo: number; endPlantNo: number },
  right: { startPlantNo: number; endPlantNo: number }
) {
  return left.startPlantNo <= right.endPlantNo && right.startPlantNo <= left.endPlantNo;
}

function capacityFromSuitableCrop(value: unknown, cropId: string | null | undefined) {
  if (!cropId || !Array.isArray(value)) return { rows: null, plantsPerRow: null };
  for (const item of value) {
    if (!isRecord(item) || item.cropId !== cropId) continue;
    return {
      rows: positiveIntFrom(item.rows),
      plantsPerRow: positiveIntFrom(item.plantsPerRow),
    };
  }
  return { rows: null, plantsPerRow: null };
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

async function validateProgramMasters(input: CreateCropDataInput) {
  const contract = await validateContract(input.farmId, input.contractId, { required: true });
  if (!contract) {
    throw new ApiError(400, "missing_contract", "Contract Ref Number is required.");
  }
  if (!contract.productionTypeId) {
    throw new ApiError(
      400,
      "missing_production_type",
      "The selected contract needs a production type master before a program can be created."
    );
  }
  if (!contract.activeTimeId) {
    throw new ApiError(
      400,
      "missing_lead_time",
      "The selected contract needs a lead-time master before a program can be created."
    );
  }
  if (!contract.reservationId) {
    throw new ApiError(
      400,
      "missing_stakeholder",
      "The selected contract needs a reservation with stakeholder master data before a program can be created."
    );
  }

  const [reservation] = await db
    .select({ stakeholderId: reservations.stakeholderId })
    .from(reservations)
    .where(and(eq(reservations.id, contract.reservationId), eq(reservations.farmId, input.farmId)))
    .limit(1);
  if (!reservation?.stakeholderId) {
    throw new ApiError(
      400,
      "missing_stakeholder",
      "The selected contract needs stakeholder master data before a program can be created."
    );
  }

  if (contract.cropId && contract.cropId !== input.cropId) {
    throw new ApiError(400, "contract_crop_mismatch", "Crop must match the selected contract.");
  }
  if (contract.cropTypeId && contract.cropTypeId !== input.cropTypeId) {
    throw new ApiError(
      400,
      "contract_crop_type_mismatch",
      "Crop type must match the selected contract."
    );
  }
  if (contract.seasonId && contract.seasonId !== input.seasonId) {
    throw new ApiError(400, "contract_season_mismatch", "Season must match the selected contract.");
  }
  if (contract.blockId && contract.blockId !== input.blockMasterId) {
    throw new ApiError(400, "contract_block_mismatch", "Block must match the selected contract.");
  }

  const [block] = await db
    .select()
    .from(blockMaster)
    .where(and(eq(blockMaster.id, input.blockMasterId), eq(blockMaster.farmId, input.farmId)))
    .limit(1);
  if (!block) {
    throw new ApiError(400, "invalid_block", "Block does not belong to this farm.");
  }
  const suitable = capacityFromSuitableCrop(block.suitableCrops, input.cropId);
  if (!suitable.rows || !suitable.plantsPerRow) {
    throw new ApiError(
      400,
      "missing_block_suitability",
      "Create block suitability for this crop with rows and plants per row before creating the program."
    );
  }

  const densityWeek = contract.plantingWeek ?? contract.pollinationStartWeek ?? 1;
  if (densityWeek < 1 || densityWeek > 52) {
    throw new ApiError(
      400,
      "invalid_density_week",
      "The selected contract needs a valid planting or pollination week for density lookup."
    );
  }
  const [density] = await db
    .select({ id: densityMaster.id })
    .from(densityMaster)
    .where(
      and(
        eq(densityMaster.farmId, input.farmId),
        eq(densityMaster.cropId, input.cropId),
        eq(densityMaster.cropTypeId, input.cropTypeId),
        eq(densityMaster.productionTypeId, contract.productionTypeId),
        eq(densityMaster.stakeholderId, reservation.stakeholderId),
        eq(densityMaster.year, contract.year),
        lte(densityMaster.validFrom, densityWeek),
        gte(densityMaster.validTo, densityWeek)
      )
    );
  if (!density) {
    throw new ApiError(
      400,
      "missing_density_master",
      "Create a density master for this contract crop, crop type, production type, and year first."
    );
  }
}

type PlantingValidationResult = {
  normalizedData: Record<string, unknown>;
  segments: AllocationSegmentInput[];
};

async function validatePlantingModule(
  cropDataId: string,
  farmId: string,
  userId: string,
  data: Record<string, unknown>
): Promise<PlantingValidationResult> {
  const record = await getCropDataById(cropDataId, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");

  const [contract] = record.contractId
    ? await db
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
          productionTypeId: contracts.productionTypeId,
          activeTimeId: contracts.activeTimeId,
        })
        .from(contracts)
        .where(and(eq(contracts.id, record.contractId), eq(contracts.farmId, farmId)))
        .limit(1)
    : [];

  const effectiveBlockId = record.blockMasterId ?? contract?.blockId ?? null;
  const [block] = effectiveBlockId
    ? await db
        .select({
          id: blockMaster.id,
          blockRows: blockMaster.rows,
          blockName: blockMaster.blockName,
          suitableCrops: blockMaster.suitableCrops,
        })
        .from(blockMaster)
        .where(and(eq(blockMaster.id, effectiveBlockId), eq(blockMaster.farmId, farmId)))
        .limit(1)
    : [];

  const suitable = capacityFromSuitableCrop(block?.suitableCrops, record.cropId);
  const maxRows = suitable.rows ?? block?.blockRows ?? null;
  const plantsPerRow = suitable.plantsPerRow;
  const entries = plantingEntries(data);

  const normalizedRows = entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const leftRow = numberFrom(left.entry.rowNo ?? left.entry.rowNumber) ?? left.index + 1;
      const rightRow = numberFrom(right.entry.rowNo ?? right.entry.rowNumber) ?? right.index + 1;
      const rowOrder = leftRow - rightRow;
      return rowOrder === 0 ? left.index - right.index : rowOrder;
    });

  const rowCursor = new Map<number, number>();
  const rowSequence = new Map<number, number>();
  const currentPeriod = contract ? periodRange(contract) : null;
  const segments: AllocationSegmentInput[] = [];
  const normalizedEntries: Record<string, unknown>[] = [];

  for (const { entry, index } of normalizedRows) {
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
        `Row ${rowNo} is outside ${block?.blockName ?? "the selected block"}, which has ${maxRows} rows.`
      );
    }

    const plantCount = positiveIntFrom(
      entry.plannedPlants ?? entry.plantedPlants ?? entry.noOfPlants
    );
    const sequence = (rowSequence.get(rowNo) ?? 0) + 1;
    rowSequence.set(rowNo, sequence);

    if (!plantCount) {
      normalizedEntries.push({ ...entry, rowNo, sequence });
      continue;
    }

    const startPlantNo = (rowCursor.get(rowNo) ?? 0) + 1;
    const endPlantNo = startPlantNo + plantCount - 1;
    rowCursor.set(rowNo, endPlantNo);

    if (plantsPerRow && endPlantNo > plantsPerRow) {
      throw new ApiError(
        400,
        "row_capacity_exceeded",
        `Row ${rowNo} can fit ${plantsPerRow} plants for this crop. The saved entries reach plant ${endPlantNo}.`
      );
    }

    const normalizedEntry = {
      ...entry,
      rowNo,
      sequence,
      plantCount,
      startPlantNo,
      endPlantNo,
    };
    normalizedEntries.push(normalizedEntry);
    segments.push({
      cropDataId,
      contractLineId: record.contractId ?? null,
      blockMasterId: effectiveBlockId,
      cropId: record.cropId ?? null,
      varietyId: record.varietyId ?? null,
      rowNo,
      gender: stringFrom(entry.gender ?? entry.type) ?? "Unknown",
      plantCount,
      startPlantNo,
      endPlantNo,
      sequence,
      periodYear: currentPeriod?.year ?? null,
      periodStartWeek: currentPeriod?.startWeek ?? null,
      periodEndWeek: currentPeriod?.endWeek ?? null,
      userId,
    });
  }

  if (!contract || !currentPeriod || !effectiveBlockId) {
    return { normalizedData: { ...data, entries: normalizedEntries }, segments };
  }

  const otherSegments = await db
    .select({
      cropDataId: cropDataAllocationSegments.cropDataId,
      rowNo: cropDataAllocationSegments.rowNo,
      startPlantNo: cropDataAllocationSegments.startPlantNo,
      endPlantNo: cropDataAllocationSegments.endPlantNo,
      periodYear: cropDataAllocationSegments.periodYear,
      periodStartWeek: cropDataAllocationSegments.periodStartWeek,
      periodEndWeek: cropDataAllocationSegments.periodEndWeek,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      gender: cropDataAllocationSegments.gender,
      contractNo: cropData.contractNo,
      contractAbsNo: contracts.absContractNo,
      contractRef: contracts.contractRef,
    })
    .from(cropDataAllocationSegments)
    .innerJoin(cropData, eq(cropData.id, cropDataAllocationSegments.cropDataId))
    .leftJoin(contracts, eq(contracts.id, cropDataAllocationSegments.contractLineId))
    .leftJoin(crops, eq(crops.id, cropDataAllocationSegments.cropId))
    .leftJoin(cropVarieties, eq(cropVarieties.id, cropDataAllocationSegments.varietyId))
    .where(
      and(
        eq(cropData.farmId, farmId),
        eq(cropData.status, "active"),
        eq(cropDataAllocationSegments.blockMasterId, effectiveBlockId)
      )
    );

  for (const segment of segments) {
    for (const other of otherSegments) {
      if (other.cropDataId === cropDataId) continue;
      if (other.rowNo !== segment.rowNo) continue;
      if (
        other.periodYear == null ||
        other.periodStartWeek == null ||
        other.periodEndWeek == null
      ) {
        continue;
      }
      const otherRange = periodRange({
        year: other.periodYear,
        materialArrivalWeek: other.periodStartWeek,
        plantingWeek: null,
        pollinationStartWeek: null,
        endWeek: other.periodEndWeek,
      });
      if (!otherRange || !rangesOverlap(currentPeriod, otherRange)) continue;
      if (!plantRangesOverlap(segment, other)) continue;

      const crop = other.cropName ?? "another crop";
      const variety = other.varietyName ?? "unknown variety";
      const ref = other.contractAbsNo ?? other.contractNo ?? other.contractRef ?? "linked contract";
      throw new ApiError(
        409,
        "row_plant_range_already_used",
        `Row ${segment.rowNo} plants ${segment.startPlantNo}-${segment.endPlantNo} overlap with ${crop} / ${variety} / ${other.gender} for ${ref}.`
      );
    }
  }

  return { normalizedData: { ...data, entries: normalizedEntries }, segments };
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
  await validateProgramMasters(input);
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
  let data = input.data;
  if (moduleType === "planting_records") {
    const validated = await validatePlantingModule(cropDataId, farmId, ctx.userId, input.data);
    data = validated.normalizedData;
    await replaceAllocationSegments(cropDataId, validated.segments);
  }
  const result = await upsertModule(cropDataId, moduleType, data);
  await logAudit({
    userId: ctx.userId,
    farmId,
    action: "crop_data.module_updated",
    resource: cropDataId,
    metadata: { moduleType },
    newData: data,
  });
  return result;
}
