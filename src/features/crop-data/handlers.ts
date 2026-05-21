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
  getAllModules,
} from "./queries";
import {
  createCropDataRecord,
  updateCropDataRecord,
  deleteCropDataRecord,
  upsertProgramInfo,
  upsertNursery,
  upsertModule,
} from "./mutations";
import type {
  CreateCropDataInput,
  UpdateCropDataInput,
  UpdateProgramInfoInput,
  UpdateNurseryInput,
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
  const [pi, nurs, modules] = await Promise.all([
    getProgramInfo(id),
    getNursery(id),
    getAllModules(id),
  ]);
  return { ...record, programInfo: pi, nursery: nurs, modules };
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
