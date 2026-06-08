import { addDays, differenceInDays, parseISO, format } from "date-fns";

export interface PlantingCalculationInput {
  plantingMethod: "Direct" | "Transplant" | "Cutting" | "Seed";
  nurseryStartDate?: string | null;
  fieldPlantingDate?: string | null;
  daysInNursery?: number | null;
  daysToMaturity: number;
  harvestWindowDays: number;
  timeBetweenPlantingsDays: number;
}

export interface PlantingCalculationResult {
  nurseryStartDate: string | null;
  fieldPlantingDate: string;
  firstHarvestDate: string;
  harvestEndDate: string;
  timelineStart: string;
  timelineEnd: string;
}

/**
 * Replaces the old Python "calculate_planting_dates" module.
 * Takes standard ISO strings (YYYY-MM-DD) and project operational timelines.
 */
export function calculatePlantingDates(input: PlantingCalculationInput): PlantingCalculationResult {
  const isTransplant = input.plantingMethod === "Transplant";
  let computedFieldDate: Date;
  let actualNurseryStart: string | null = null;

  if (isTransplant) {
    if (!input.nurseryStartDate) {
      throw new Error("Nursery start date is required for transplant method.");
    }
    const daysInNursery = input.daysInNursery || 28; // Fallback to 4 weeks
    const baseNurseryDate = parseISO(input.nurseryStartDate);

    computedFieldDate = addDays(baseNurseryDate, daysInNursery);
    actualNurseryStart = input.nurseryStartDate;
  } else {
    // Direct Sow, Cutting, or Seed
    if (!input.fieldPlantingDate) {
      throw new Error("Field planting date is required for direct sow methods.");
    }
    computedFieldDate = parseISO(input.fieldPlantingDate);
  }

  const firstHarvest = addDays(computedFieldDate, input.daysToMaturity);
  const harvestEnd = addDays(firstHarvest, input.harvestWindowDays);

  const timelineStartDate = actualNurseryStart ? parseISO(actualNurseryStart) : computedFieldDate;
  // Timeline end includes the cleanup and block prep buffer time
  const timelineEndDate = addDays(harvestEnd, input.timeBetweenPlantingsDays);

  const formatStr = (d: Date) => format(d, "yyyy-MM-dd");

  return {
    nurseryStartDate: actualNurseryStart,
    fieldPlantingDate: formatStr(computedFieldDate),
    firstHarvestDate: formatStr(firstHarvest),
    harvestEndDate: formatStr(harvestEnd),
    timelineStart: formatStr(timelineStartDate),
    timelineEnd: formatStr(timelineEndDate),
  };
}
