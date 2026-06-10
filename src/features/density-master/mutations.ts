import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { densityMaster } from "@/db/schema";
import type { CreateDensityMasterInput, UpdateDensityMasterInput, DensityMaster } from "./schema";
import { getDensityById } from "./queries";

export async function insertDensity(
  farmId: string,
  input: CreateDensityMasterInput
): Promise<DensityMaster | null> {
  const [row] = await db
    .insert(densityMaster)
    .values({
      farmId,
      cropId: input.cropId ?? null,
      cropTypeId: input.cropTypeId ?? null,
      productionTypeId: input.productionTypeId ?? null,
      stakeholderId: input.stakeholderId ?? null,
      year: input.year ?? null,
      maleDensity: input.maleDensity ?? null,
      femaleDensity: input.femaleDensity ?? null,
      validFrom: input.validFrom ?? 1,
      validTo: input.validTo ?? 52,
    })
    .returning();

  if (!row) return null;
  return getDensityById(row.id, farmId);
}

export async function updateDensity(
  densityId: string,
  farmId: string,
  input: UpdateDensityMasterInput
): Promise<DensityMaster | null> {
  await db
    .update(densityMaster)
    .set({
      ...(input.cropId !== undefined && { cropId: input.cropId }),
      ...(input.cropTypeId !== undefined && { cropTypeId: input.cropTypeId }),
      ...(input.productionTypeId !== undefined && { productionTypeId: input.productionTypeId }),
      ...(input.stakeholderId !== undefined && { stakeholderId: input.stakeholderId }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.maleDensity !== undefined && { maleDensity: input.maleDensity }),
      ...(input.femaleDensity !== undefined && { femaleDensity: input.femaleDensity }),
      ...(input.validFrom !== undefined && { validFrom: input.validFrom }),
      ...(input.validTo !== undefined && { validTo: input.validTo }),
      updatedAt: new Date(),
    })
    .where(and(eq(densityMaster.id, densityId), eq(densityMaster.farmId, farmId)));

  return getDensityById(densityId, farmId);
}

export async function deleteDensity(densityId: string, farmId: string): Promise<void> {
  await db
    .delete(densityMaster)
    .where(and(eq(densityMaster.id, densityId), eq(densityMaster.farmId, farmId)));
}
