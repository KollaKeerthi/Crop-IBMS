import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  cropData,
  programInfo,
  nursery,
  cropDataModules,
  crops,
  cropVarieties,
  seasons,
} from "@/db/schema";

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
    .select()
    .from(cropData)
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
