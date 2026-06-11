import { eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { crops, cropTypes, cropVarieties } from "@/db/schema";
import type { Crop, CropType, CropVariety } from "./schema";

type CropRow = typeof crops.$inferSelect;
type CropTypeRow = typeof cropTypes.$inferSelect;
type CropVarietyRow = typeof cropVarieties.$inferSelect;

function toCropType(row: CropTypeRow): CropType {
  return {
    id: row.id,
    cropId: row.cropId,
    name: row.name,
    colour: row.colour ?? null,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toCropVariety(row: CropVarietyRow): CropVariety {
  return {
    id: row.id,
    cropId: row.cropId,
    name: row.name,
    gender: (row.gender as "Male" | "Female") ?? null,
    colourDescription: row.colourDescription ?? null,
    stakeholderId: row.stakeholderId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toCrop(row: CropRow, types: CropType[], varieties: CropVariety[]): Crop {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName ?? null,
    scientificName: row.scientificName ?? null,
    family: row.family ?? null,
    description: row.description ?? null,
    color: row.color ?? null,
    imageUrl: row.imageUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    types,
    varieties,
  };
}

export async function listCrops(search?: string): Promise<Crop[]> {
  const cropRows = search
    ? await db
        .select()
        .from(crops)
        .where(ilike(crops.name, `%${search}%`))
        .orderBy(crops.name)
    : await db.select().from(crops).orderBy(crops.name);

  if (cropRows.length === 0) return [];

  const [allTypes, allVarieties] = await Promise.all([
    db.select().from(cropTypes),
    db.select().from(cropVarieties),
  ]);

  const typesByCrop = new Map<string, CropType[]>();
  const varietiesByCrop = new Map<string, CropVariety[]>();

  for (const t of allTypes) {
    if (!typesByCrop.has(t.cropId)) typesByCrop.set(t.cropId, []);
    typesByCrop.get(t.cropId)!.push(toCropType(t));
  }
  for (const v of allVarieties) {
    if (!varietiesByCrop.has(v.cropId)) varietiesByCrop.set(v.cropId, []);
    varietiesByCrop.get(v.cropId)!.push(toCropVariety(v));
  }

  return cropRows.map((r) =>
    toCrop(r, typesByCrop.get(r.id) ?? [], varietiesByCrop.get(r.id) ?? [])
  );
}

export async function getCropById(cropId: string): Promise<Crop | null> {
  const [row] = await db.select().from(crops).where(eq(crops.id, cropId));
  if (!row) return null;

  const [typeRows, varietyRows] = await Promise.all([
    db.select().from(cropTypes).where(eq(cropTypes.cropId, cropId)),
    db.select().from(cropVarieties).where(eq(cropVarieties.cropId, cropId)),
  ]);

  return toCrop(row, typeRows.map(toCropType), varietyRows.map(toCropVariety));
}

export async function listCropTypes(cropId: string): Promise<CropType[]> {
  const rows = await db.select().from(cropTypes).where(eq(cropTypes.cropId, cropId));
  return rows.map(toCropType);
}

export async function listCropVarieties(cropId: string): Promise<CropVariety[]> {
  const rows = await db.select().from(cropVarieties).where(eq(cropVarieties.cropId, cropId));
  return rows.map(toCropVariety);
}
