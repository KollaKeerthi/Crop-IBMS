import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plantings } from "@/db/schema";
import type { CreatePlantingInput, UpdatePlantingInput, Planting } from "./schema";
import { getPlantingById } from "./queries";

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function createPlanting(input: CreatePlantingInput): Promise<Planting | null> {
  const [row] = await db
    .insert(plantings)
    .values({
      farmId: input.farmId,
      cropId: input.cropId ?? null,
      varietyId: input.varietyId ?? null,
      seasonId: input.seasonId ?? null,
      status: input.status ?? "Planned",
      plantingMethod: input.plantingMethod ?? null,
      nurseryStartDate: parseDate(input.nurseryStartDate),
      fieldPlantingDate: parseDate(input.fieldPlantingDate),
      firstHarvestDate: parseDate(input.firstHarvestDate),
      harvestEndDate: parseDate(input.harvestEndDate),
      numRows: input.numRows ?? null,
      spacingM: input.spacingM ?? null,
      areaSqm: input.areaSqm ?? null,
      blockMasterId: input.blockMasterId ?? null,
      locationType: input.locationType ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  if (!row) return null;
  return getPlantingById(row.id, input.farmId);
}

export async function updatePlanting(id: string, input: UpdatePlantingInput): Promise<void> {
  await db
    .update(plantings)
    .set({
      ...(input.cropId !== undefined && { cropId: input.cropId }),
      ...(input.varietyId !== undefined && { varietyId: input.varietyId }),
      ...(input.seasonId !== undefined && { seasonId: input.seasonId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.plantingMethod !== undefined && { plantingMethod: input.plantingMethod }),
      ...(input.nurseryStartDate !== undefined && {
        nurseryStartDate: parseDate(input.nurseryStartDate),
      }),
      ...(input.fieldPlantingDate !== undefined && {
        fieldPlantingDate: parseDate(input.fieldPlantingDate),
      }),
      ...(input.firstHarvestDate !== undefined && {
        firstHarvestDate: parseDate(input.firstHarvestDate),
      }),
      ...(input.harvestEndDate !== undefined && {
        harvestEndDate: parseDate(input.harvestEndDate),
      }),
      ...(input.numRows !== undefined && { numRows: input.numRows }),
      ...(input.spacingM !== undefined && { spacingM: input.spacingM }),
      ...(input.areaSqm !== undefined && { areaSqm: input.areaSqm }),
      ...(input.blockMasterId !== undefined && { blockMasterId: input.blockMasterId }),
      ...(input.locationType !== undefined && { locationType: input.locationType }),
      ...(input.notes !== undefined && { notes: input.notes }),
      updatedAt: new Date(),
    })
    .where(eq(plantings.id, id));
}

export async function deletePlanting(id: string): Promise<void> {
  await db.delete(plantings).where(eq(plantings.id, id));
}
