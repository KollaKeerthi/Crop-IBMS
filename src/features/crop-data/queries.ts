import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  cropData,
  programInfo,
  nursery,
  revenue,
  cropDataModules,
  mediaAttachments,
  crops,
  cropTypes,
  cropVarieties,
  seasons,
} from "@/db/schema";

const MEDIA_ENTITY = "crop_data";

export async function listCropData(farmId: string) {
  const rows = await db
    .select({
      id: cropData.id,
      farmId: cropData.farmId,
      cropId: cropData.cropId,
      cropName: crops.name,
      varietyName: cropVarieties.name,
      seasonName: seasons.name,
      block: cropData.block,
      fieldName: cropData.fieldName,
      fieldCode: cropData.fieldCode,
      sexExpression: cropData.sexExpression,
      contractNo: cropData.contractNo,
      headerNo: cropData.headerNo,
      customerCode: cropData.customerCode,
      contractRef: cropData.contractRef,
      status: cropData.status,
      notes: cropData.notes,
      createdAt: cropData.createdAt,
    })
    .from(cropData)
    .leftJoin(crops, eq(crops.id, cropData.cropId))
    .leftJoin(cropVarieties, eq(cropVarieties.id, cropData.varietyId))
    .leftJoin(seasons, eq(seasons.id, cropData.seasonId))
    .where(eq(cropData.farmId, farmId))
    .orderBy(cropData.createdAt);
  return rows;
}

export async function getCropDataById(id: string, farmId: string) {
  const rows = await db
    .select({
      id: cropData.id,
      farmId: cropData.farmId,
      cropId: cropData.cropId,
      cropTypeId: cropData.cropTypeId,
      varietyId: cropData.varietyId,
      seasonId: cropData.seasonId,
      cropName: crops.name,
      cropTypeName: cropTypes.name,
      varietyName: cropVarieties.name,
      seasonName: seasons.name,
      cropImageUrl: crops.imageUrl,
      block: cropData.block,
      fieldName: cropData.fieldName,
      fieldCode: cropData.fieldCode,
      sexExpression: cropData.sexExpression,
      contractNo: cropData.contractNo,
      headerNo: cropData.headerNo,
      customerCode: cropData.customerCode,
      contractRef: cropData.contractRef,
      status: cropData.status,
      notes: cropData.notes,
      createdAt: cropData.createdAt,
      updatedAt: cropData.updatedAt,
    })
    .from(cropData)
    .leftJoin(crops, eq(crops.id, cropData.cropId))
    .leftJoin(cropTypes, eq(cropTypes.id, cropData.cropTypeId))
    .leftJoin(cropVarieties, eq(cropVarieties.id, cropData.varietyId))
    .leftJoin(seasons, eq(seasons.id, cropData.seasonId))
    .where(and(eq(cropData.id, id), eq(cropData.farmId, farmId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProgramInfo(cropDataId: string) {
  const rows = await db
    .select()
    .from(programInfo)
    .where(eq(programInfo.cropDataId, cropDataId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getNursery(cropDataId: string) {
  const rows = await db.select().from(nursery).where(eq(nursery.cropDataId, cropDataId)).limit(1);
  return rows[0] ?? null;
}

export async function getRevenue(cropDataId: string) {
  const rows = await db.select().from(revenue).where(eq(revenue.cropDataId, cropDataId)).limit(1);
  return rows[0] ?? null;
}

export async function getModule(cropDataId: string, moduleType: string) {
  const rows = await db
    .select()
    .from(cropDataModules)
    .where(
      and(eq(cropDataModules.cropDataId, cropDataId), eq(cropDataModules.moduleType, moduleType))
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllModules(cropDataId: string) {
  return db.select().from(cropDataModules).where(eq(cropDataModules.cropDataId, cropDataId));
}

// ---- Generic single-record sections (production, pollination, post_harvest, …) ----

import type { SectionTable } from "./sections";
import type { CollectionTable } from "./collections";

export async function getSectionRow(table: SectionTable, cropDataId: string) {
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.cropDataId, cropDataId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listCollectionRows(table: CollectionTable, cropDataId: string) {
  return db
    .select()
    .from(table)
    .where(eq(table.cropDataId, cropDataId))
    .orderBy(desc(table.createdAt));
}

export async function listMedia(cropDataId: string) {
  return db
    .select()
    .from(mediaAttachments)
    .where(
      and(
        eq(mediaAttachments.entityType, MEDIA_ENTITY),
        eq(mediaAttachments.entityId, cropDataId)
      )
    )
    .orderBy(desc(mediaAttachments.createdAt));
}

export async function getMediaById(id: string, cropDataId: string) {
  const rows = await db
    .select()
    .from(mediaAttachments)
    .where(
      and(
        eq(mediaAttachments.id, id),
        eq(mediaAttachments.entityType, MEDIA_ENTITY),
        eq(mediaAttachments.entityId, cropDataId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}
