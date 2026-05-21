import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { cropData, programInfo, nursery, cropDataModules } from "@/db/schema";
import type {
  CreateCropDataInput,
  UpdateCropDataInput,
  UpdateProgramInfoInput,
  UpdateNurseryInput,
} from "./schema";

export async function createCropDataRecord(input: CreateCropDataInput) {
  const rows = await db.insert(cropData).values(input).returning();
  return rows[0]!;
}

export async function updateCropDataRecord(id: string, input: UpdateCropDataInput) {
  const rows = await db
    .update(cropData)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(cropData.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteCropDataRecord(id: string) {
  await db.delete(cropData).where(eq(cropData.id, id));
}

export async function upsertProgramInfo(cropDataId: string, input: UpdateProgramInfoInput) {
  const existing = await db
    .select()
    .from(programInfo)
    .where(eq(programInfo.cropDataId, cropDataId))
    .limit(1);

  const { plantingDate, ...rest } = input;
  const dbInput = {
    ...rest,
    ...(plantingDate !== undefined ? { plantingDate: new Date(plantingDate) } : {}),
  };

  if (existing[0]) {
    const rows = await db
      .update(programInfo)
      .set({ ...dbInput, updatedAt: new Date() })
      .where(eq(programInfo.cropDataId, cropDataId))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(programInfo)
    .values({ cropDataId, ...dbInput })
    .returning();
  return rows[0]!;
}

export async function upsertNursery(cropDataId: string, input: UpdateNurseryInput) {
  const existing = await db
    .select()
    .from(nursery)
    .where(eq(nursery.cropDataId, cropDataId))
    .limit(1);

  const { startDate, endDate, ...rest } = input;
  const dbInput = {
    ...rest,
    ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
    ...(endDate !== undefined ? { endDate: new Date(endDate) } : {}),
  };

  if (existing[0]) {
    const rows = await db
      .update(nursery)
      .set({ ...dbInput, updatedAt: new Date() })
      .where(eq(nursery.cropDataId, cropDataId))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(nursery)
    .values({ cropDataId, ...dbInput })
    .returning();
  return rows[0]!;
}

export async function upsertModule(
  cropDataId: string,
  moduleType: string,
  data: Record<string, unknown>
) {
  const existing = await db
    .select()
    .from(cropDataModules)
    .where(
      and(eq(cropDataModules.cropDataId, cropDataId), eq(cropDataModules.moduleType, moduleType))
    )
    .limit(1);

  if (existing[0]) {
    const rows = await db
      .update(cropDataModules)
      .set({ data, updatedAt: new Date() })
      .where(
        and(eq(cropDataModules.cropDataId, cropDataId), eq(cropDataModules.moduleType, moduleType))
      )
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(cropDataModules)
    .values({ cropDataId, moduleType, data })
    .returning();
  return rows[0]!;
}
