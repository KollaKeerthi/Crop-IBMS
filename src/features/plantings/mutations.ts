// import { eq } from "drizzle-orm";
// import { db } from "@/db";
// import { plantings } from "@/db/schema";
// import type { CreatePlantingInput, UpdatePlantingInput, Planting } from "./schema";
// import { getPlantingById } from "./queries";

// function parseDate(dateStr: string | null | undefined): Date | null {
//   if (!dateStr) return null;
//   const d = new Date(dateStr);
//   return isNaN(d.getTime()) ? null : d;
// }

// export async function createPlanting(input: CreatePlantingInput): Promise<Planting | null> {
//   const [row] = await db
//     .insert(plantings)
//     .values({
//       farmId: input.farmId,
//       cropId: input.cropId ?? null,
//       varietyId: input.varietyId ?? null,
//       seasonId: input.seasonId ?? null,
//       status: input.status ?? "Planned",
//       plantingMethod: input.plantingMethod ?? null,
//       nurseryStartDate: parseDate(input.nurseryStartDate),
//       fieldPlantingDate: parseDate(input.fieldPlantingDate),
//       firstHarvestDate: parseDate(input.firstHarvestDate),
//       harvestEndDate: parseDate(input.harvestEndDate),
//       numRows: input.numRows ?? null,
//       spacingM: input.spacingM ?? null,
//       areaSqm: input.areaSqm ?? null,
//       blockMasterId: input.blockMasterId ?? null,
//       locationType: input.locationType ?? null,
//       notes: input.notes ?? null,
//     })
//     .returning();

//   if (!row) return null;
//   return getPlantingById(row.id, input.farmId);
// }

// export async function updatePlanting(id: string, input: UpdatePlantingInput): Promise<void> {
//   await db
//     .update(plantings)
//     .set({
//       ...(input.cropId !== undefined && { cropId: input.cropId }),
//       ...(input.varietyId !== undefined && { varietyId: input.varietyId }),
//       ...(input.seasonId !== undefined && { seasonId: input.seasonId }),
//       ...(input.status !== undefined && { status: input.status }),
//       ...(input.plantingMethod !== undefined && { plantingMethod: input.plantingMethod }),
//       ...(input.nurseryStartDate !== undefined && {
//         nurseryStartDate: parseDate(input.nurseryStartDate),
//       }),
//       ...(input.fieldPlantingDate !== undefined && {
//         fieldPlantingDate: parseDate(input.fieldPlantingDate),
//       }),
//       ...(input.firstHarvestDate !== undefined && {
//         firstHarvestDate: parseDate(input.firstHarvestDate),
//       }),
//       ...(input.harvestEndDate !== undefined && {
//         harvestEndDate: parseDate(input.harvestEndDate),
//       }),
//       ...(input.numRows !== undefined && { numRows: input.numRows }),
//       ...(input.spacingM !== undefined && { spacingM: input.spacingM }),
//       ...(input.areaSqm !== undefined && { areaSqm: input.areaSqm }),
//       ...(input.blockMasterId !== undefined && { blockMasterId: input.blockMasterId }),
//       ...(input.locationType !== undefined && { locationType: input.locationType }),
//       ...(input.notes !== undefined && { notes: input.notes }),
//       updatedAt: new Date(),
//     })
//     .where(eq(plantings.id, id));
// }

// export async function deletePlanting(id: string): Promise<void> {
//   await db.delete(plantings).where(eq(plantings.id, id));
// }
import { eq, and, ne, gte, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { plantings } from "@/db/schema";
import type { CreatePlantingInput, UpdatePlantingInput, Planting } from "./schema";
import { getPlantingById } from "./queries";
import { calculatePlantingDates } from "./compute";

/**
 * Validates that a field master block isn't already occupied during the requested window.
 */
async function checkBlockConflict(
  blockMasterId: string | null,
  fieldPlantingDate: string,
  timelineEnd: string,
  excludePlantingId?: string
): Promise<void> {
  if (!blockMasterId) return;

  const targetStart = new Date(fieldPlantingDate);
  const targetEnd = new Date(timelineEnd);

  // SQL: Find any record in this block where the timeline overlaps with our window
  const conditions = [
    eq(plantings.blockMasterId, blockMasterId),
    lte(plantings.fieldPlantingDate, targetEnd),
    gte(plantings.harvestEndDate, targetStart), // Corresponds to checking space-time utilization
  ];

  if (excludePlantingId) {
    conditions.push(ne(plantings.id, excludePlantingId));
  }

  const conflictingRows = await db
    .select({ id: plantings.id })
    .from(plantings)
    .where(and(...conditions));

  if (conflictingRows.length > 0) {
    throw new Error(
      "Date conflict: This block is already scheduled for another planting during this window."
    );
  }
}

export async function createPlanting(input: CreatePlantingInput): Promise<Planting | null> {
  // 1. Run the automatic calculation engine (default to standard intervals if not provided)
  const calculated = calculatePlantingDates({
    plantingMethod: input.plantingMethod || "Direct",
    nurseryStartDate: input.nurseryStartDate,
    fieldPlantingDate: input.fieldPlantingDate,
    daysInNursery: input.daysInNursery ?? 28,
    daysToMaturity: input.daysToMaturity ?? 60,
    harvestWindowDays: input.harvestWindowDays ?? 30,
    timeBetweenPlantingsDays: input.timeBetweenPlantingsDays ?? 14,
  });

  // 2. Enforce the double-booking protection rule
  if (input.blockMasterId) {
    await checkBlockConflict(
      input.blockMasterId,
      calculated.fieldPlantingDate,
      calculated.timelineEnd
    );
  }

  const [row] = await db
    .insert(plantings)
    .values({
      farmId: input.farmId,
      cropId: input.cropId ?? null,
      varietyId: input.varietyId ?? null,
      seasonId: input.seasonId ?? null,
      status: input.status ?? "Planned",
      plantingMethod: input.plantingMethod ?? null,
      nurseryStartDate: calculated.nurseryStartDate ? new Date(calculated.nurseryStartDate) : null,
      fieldPlantingDate: new Date(calculated.fieldPlantingDate),
      firstHarvestDate: new Date(calculated.firstHarvestDate),
      harvestEndDate: new Date(calculated.harvestEndDate),
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
  const existing = await db.select().from(plantings).where(eq(plantings.id, id));
  if (!existing[0]) throw new Error("Planting instance not found.");

  const current = existing[0];

  const rawMethod = input.plantingMethod ?? current.plantingMethod;
  const method =
    rawMethod === "Direct" ||
    rawMethod === "Transplant" ||
    rawMethod === "Cutting" ||
    rawMethod === "Seed"
      ? rawMethod
      : "Direct";

  // Re-run calculations if dates or methods changed during dragging/editing
  const calculated = calculatePlantingDates({
    plantingMethod: method,
    nurseryStartDate:
      input.nurseryStartDate !== undefined
        ? input.nurseryStartDate
        : current.nurseryStartDate?.toISOString().split("T")[0],
    fieldPlantingDate:
      input.fieldPlantingDate !== undefined
        ? input.fieldPlantingDate
        : current.fieldPlantingDate?.toISOString().split("T")[0],
    daysToMaturity: input.daysToMaturity ?? 60,
    harvestWindowDays: input.harvestWindowDays ?? 30,
    timeBetweenPlantingsDays: input.timeBetweenPlantingsDays ?? 14,
  });

  const blockMasterId =
    input.blockMasterId !== undefined ? input.blockMasterId : current.blockMasterId;
  if (blockMasterId) {
    await checkBlockConflict(
      blockMasterId,
      calculated.fieldPlantingDate,
      calculated.timelineEnd,
      id
    );
  }

  await db
    .update(plantings)
    .set({
      status: input.status ?? current.status,
      plantingMethod: input.plantingMethod ?? current.plantingMethod,
      nurseryStartDate: calculated.nurseryStartDate ? new Date(calculated.nurseryStartDate) : null,
      fieldPlantingDate: new Date(calculated.fieldPlantingDate),
      firstHarvestDate: new Date(calculated.firstHarvestDate),
      harvestEndDate: new Date(calculated.harvestEndDate),
      numRows: input.numRows !== undefined ? input.numRows : current.numRows,
      spacingM: input.spacingM !== undefined ? input.spacingM : current.spacingM,
      notes: input.notes !== undefined ? input.notes : current.notes,
      updatedAt: new Date(),
    })
    .where(eq(plantings.id, id));
}
export async function deletePlanting(id: string): Promise<void> {
  await db.delete(plantings).where(eq(plantings.id, id));
}
