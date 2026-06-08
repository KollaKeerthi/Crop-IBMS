import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { crops, cropTypes, cropVarieties } from "@/db/schema";
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
import { getCropById } from "./queries";

export async function insertCrop(input: CreateCropInput): Promise<Crop | null> {
  const [row] = await db
    .insert(crops)
    .values({
      name: input.name,
      shortName: input.shortName ?? null,
      scientificName: input.scientificName ?? null,
      family: input.family ?? null,
      description: input.description ?? null,
      color: input.color ?? null,
      imageUrl: input.imageUrl || null,
    })
    .returning();

  if (!row) return null;
  return getCropById(row.id);
}

export async function updateCrop(cropId: string, input: UpdateCropInput): Promise<Crop | null> {
  await db
    .update(crops)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.shortName !== undefined && { shortName: input.shortName }),
      ...(input.scientificName !== undefined && { scientificName: input.scientificName }),
      ...(input.family !== undefined && { family: input.family }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
      updatedAt: new Date(),
    })
    .where(eq(crops.id, cropId));

  return getCropById(cropId);
}

export async function deleteCrop(cropId: string): Promise<void> {
  await db.delete(crops).where(eq(crops.id, cropId));
}

export async function insertCropType(
  cropId: string,
  input: CreateCropTypeInput
): Promise<CropType | null> {
  const [row] = await db
    .insert(cropTypes)
    .values({
      cropId,
      name: input.name,
      colour: input.colour ?? null,
      description: input.description ?? null,
    })
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    cropId: row.cropId,
    name: row.name,
    colour: row.colour ?? null,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateCropType(
  cropId: string,
  typeId: string,
  input: UpdateCropTypeInput
): Promise<CropType | null> {
  const [row] = await db
    .update(cropTypes)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.colour !== undefined && { colour: input.colour }),
      ...(input.description !== undefined && { description: input.description }),
    })
    .where(and(eq(cropTypes.id, typeId), eq(cropTypes.cropId, cropId)))
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    cropId: row.cropId,
    name: row.name,
    colour: row.colour ?? null,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteCropType(cropId: string, typeId: string): Promise<void> {
  await db.delete(cropTypes).where(and(eq(cropTypes.id, typeId), eq(cropTypes.cropId, cropId)));
}

export async function insertCropVariety(
  cropId: string,
  input: CreateCropVarietyInput
): Promise<CropVariety | null> {
  const [row] = await db
    .insert(cropVarieties)
    .values({
      cropId,
      name: input.name,
      gender: input.gender ?? null,
      colourDescription: input.colourDescription ?? null,
    })
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    cropId: row.cropId,
    name: row.name,
    gender: (row.gender as "Male" | "Female") ?? null,
    colourDescription: row.colourDescription ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateCropVariety(
  cropId: string,
  varietyId: string,
  input: UpdateCropVarietyInput
): Promise<CropVariety | null> {
  const [row] = await db
    .update(cropVarieties)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.colourDescription !== undefined && { colourDescription: input.colourDescription }),
    })
    .where(and(eq(cropVarieties.id, varietyId), eq(cropVarieties.cropId, cropId)))
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    cropId: row.cropId,
    name: row.name,
    gender: (row.gender as "Male" | "Female") ?? null,
    colourDescription: row.colourDescription ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteCropVariety(cropId: string, varietyId: string): Promise<void> {
  await db
    .delete(cropVarieties)
    .where(and(eq(cropVarieties.id, varietyId), eq(cropVarieties.cropId, cropId)));
}
