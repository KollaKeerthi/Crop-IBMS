import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listCrops, getCropById } from "./queries";
import {
  insertCrop,
  updateCrop,
  deleteCrop,
  insertCropType,
  updateCropType,
  deleteCropType,
  insertCropVariety,
  updateCropVariety,
  deleteCropVariety,
} from "./mutations";
import type {
  CreateCropInput,
  UpdateCropInput,
  CreateCropTypeInput,
  UpdateCropTypeInput,
  CreateCropVarietyInput,
  UpdateCropVarietyInput,
  Crop,
  CropType,
  CropVariety,
} from "./schema";
import {
  assertCropCanDelete,
  assertCropTypeCanDelete,
  assertCropVarietyCanDelete,
} from "@/features/crop-information/delete-guards";

export async function listCropsHandler(ctx: ApiContext, search?: string): Promise<Crop[]> {
  return listCrops(search);
}

export async function getCropHandler(ctx: ApiContext, cropId: string): Promise<Crop> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");
  return crop;
}

export async function createCropHandler(ctx: ApiContext, input: CreateCropInput): Promise<Crop> {
  const crop = await insertCrop(input);
  if (!crop) throw new ApiError(500, "internal_error", "Could not create crop.");

  log.info({ userId: ctx.userId, cropId: crop.id }, "crops.created");
  await logAudit({
    userId: ctx.userId,
    action: "crop.created",
    resource: crop.id,
    resourceName: crop.name,
  });

  return crop;
}

export async function updateCropHandler(
  ctx: ApiContext,
  cropId: string,
  input: UpdateCropInput
): Promise<Crop> {
  const existing = await getCropById(cropId);
  if (!existing) throw new ApiError(404, "not_found", "Crop not found.");

  const updated = await updateCrop(cropId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update crop.");

  log.info({ userId: ctx.userId, cropId }, "crops.updated");
  await logAudit({
    userId: ctx.userId,
    action: "crop.updated",
    resource: cropId,
    resourceName: existing.name,
    previousData: { name: existing.name, description: existing.description } as Record<
      string,
      unknown
    >,
    newData: { name: updated.name, description: updated.description } as Record<string, unknown>,
  });

  return updated;
}

export async function deleteCropHandler(ctx: ApiContext, cropId: string): Promise<void> {
  const existing = await getCropById(cropId);
  if (!existing) throw new ApiError(404, "not_found", "Crop not found.");

  await assertCropCanDelete(cropId);
  await deleteCrop(cropId);

  log.info({ userId: ctx.userId, cropId }, "crops.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "crop.deleted",
    resource: cropId,
    resourceName: existing.name,
  });
}

export async function createCropTypeHandler(
  ctx: ApiContext,
  cropId: string,
  input: CreateCropTypeInput
): Promise<CropType> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");

  const type = await insertCropType(cropId, input);
  if (!type) throw new ApiError(500, "internal_error", "Could not create crop type.");

  log.info({ userId: ctx.userId, cropId, typeId: type.id }, "crop_types.created");
  await logAudit({
    userId: ctx.userId,
    action: "crop_type.created",
    resource: type.id,
    resourceName: type.name,
    metadata: { cropId, cropName: crop.name },
  });
  return type;
}

export async function updateCropTypeHandler(
  ctx: ApiContext,
  cropId: string,
  typeId: string,
  input: UpdateCropTypeInput
): Promise<CropType> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");
  const existingType = crop.types.find((type) => type.id === typeId);
  if (!existingType) throw new ApiError(404, "not_found", "Crop type not found.");

  const type = await updateCropType(cropId, typeId, input);
  if (!type) throw new ApiError(404, "not_found", "Crop type not found.");

  log.info({ userId: ctx.userId, cropId, typeId }, "crop_types.updated");
  await logAudit({
    userId: ctx.userId,
    action: "crop_type.updated",
    resource: typeId,
    resourceName: type.name,
    metadata: { cropId, cropName: crop.name },
  });
  return type;
}

export async function deleteCropTypeHandler(
  ctx: ApiContext,
  cropId: string,
  typeId: string
): Promise<void> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");
  const existingType = crop.types.find((type) => type.id === typeId);
  if (!existingType) throw new ApiError(404, "not_found", "Crop type not found.");

  await assertCropTypeCanDelete(typeId);
  await deleteCropType(cropId, typeId);
  log.info({ userId: ctx.userId, typeId }, "crop_types.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "crop_type.deleted",
    resource: typeId,
    metadata: { cropId, cropName: crop.name },
  });
}

export async function createCropVarietyHandler(
  ctx: ApiContext,
  cropId: string,
  input: CreateCropVarietyInput
): Promise<CropVariety> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");

  const variety = await insertCropVariety(cropId, input);
  if (!variety) throw new ApiError(500, "internal_error", "Could not create crop variety.");

  log.info({ userId: ctx.userId, cropId, varietyId: variety.id }, "crop_varieties.created");
  await logAudit({
    userId: ctx.userId,
    action: "crop_variety.created",
    resource: variety.id,
    resourceName: variety.name,
    metadata: { cropId, cropName: crop.name },
  });
  return variety;
}

export async function updateCropVarietyHandler(
  ctx: ApiContext,
  cropId: string,
  varietyId: string,
  input: UpdateCropVarietyInput
): Promise<CropVariety> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");
  const existingVariety = crop.varieties.find((variety) => variety.id === varietyId);
  if (!existingVariety) throw new ApiError(404, "not_found", "Crop variety not found.");

  const variety = await updateCropVariety(cropId, varietyId, input);
  if (!variety) throw new ApiError(404, "not_found", "Crop variety not found.");

  log.info({ userId: ctx.userId, cropId, varietyId }, "crop_varieties.updated");
  await logAudit({
    userId: ctx.userId,
    action: "crop_variety.updated",
    resource: varietyId,
    resourceName: variety.name,
    metadata: { cropId, cropName: crop.name },
  });
  return variety;
}

export async function deleteCropVarietyHandler(
  ctx: ApiContext,
  cropId: string,
  varietyId: string
): Promise<void> {
  const crop = await getCropById(cropId);
  if (!crop) throw new ApiError(404, "not_found", "Crop not found.");
  const existingVariety = crop.varieties.find((variety) => variety.id === varietyId);
  if (!existingVariety) throw new ApiError(404, "not_found", "Crop variety not found.");

  await assertCropVarietyCanDelete(varietyId);
  await deleteCropVariety(cropId, varietyId);
  log.info({ userId: ctx.userId, varietyId }, "crop_varieties.deleted");
  await logAudit({
    userId: ctx.userId,
    action: "crop_variety.deleted",
    resource: varietyId,
    metadata: { cropId, cropName: crop.name },
  });
}
