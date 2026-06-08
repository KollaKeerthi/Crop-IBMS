import { ApiError } from "@/lib/api/errors";
import { logAudit } from "@/lib/audit";
import type { ApiContext } from "@/lib/api/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { farmMemberships } from "@/db/schema";
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
  const record = await createCropDataRecord(input);
  await logAudit({ userId: ctx.userId, action: "crop_data.created", resource: record.id });
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
  const updated = await updateCropDataRecord(id, input);
  await logAudit({ userId: ctx.userId, action: "crop_data.updated", resource: id });
  return updated;
}

export async function deleteCropDataHandler(ctx: ApiContext, id: string, farmId: string) {
  await verifyFarmAccess(ctx.userId, farmId);
  const record = await getCropDataById(id, farmId);
  if (!record) throw new ApiError(404, "not_found", "Crop data record not found.");
  await deleteCropDataRecord(id);
  await logAudit({ userId: ctx.userId, action: "crop_data.deleted", resource: id });
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
  return upsertSectionRow(config.table, cropDataId, input, config.dateFields);
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
  return insertCollectionRow(config.table, cropDataId, input, config.dateFields);
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
  return insertMedia({ entityId: cropDataId, uploadedBy: ctx.userId, ...input });
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
  return upsertModule(cropDataId, moduleType, input.data);
}
