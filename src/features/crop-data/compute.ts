// Derived-field helpers. Per the agreed architecture, computed values are NEVER
// stored in the DB - they are recalculated from raw inputs here and in the UI.

/** Parse an unknown form/db value into a finite number, or null. */
export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Format a number for display, trimming trailing zeros, or "-" when null. */
export function fmtNum(v: number | null, digits = 2): string {
  if (v === null) return "-";
  const rounded = Number(v.toFixed(digits));
  return String(rounded);
}

/** a * b, or null if either operand is null. */
function mul(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : a * b;
}

/** a / b, or null if b is null/0 or a is null. */
function div(a: number | null, b: number | null): number | null {
  return a === null || b === null || b === 0 ? null : a / b;
}

/** a + b treating null as 0, but null+null stays null. */
function add(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

type Vals = Record<string, unknown>;

/**
 * Revenue derived figures for one side (male/female).
 * Contract Revenue = Agreed Unit Price times Agreed Order (kg).
 * Total Revenue    = Contract Revenue + Additional Revenue.
 * Total Revenue m2 = Total Revenue / Surface Area.
 * Total Rev m2/wk  = Total Revenue m2 / Total Weeks.
 */
export function revenueSide(rev: Vals, programInfo: Vals | null, side: "male" | "female") {
  const unitPrice = toNum(rev[`${side}AgreedUnitPrice`]);
  const weeks = toNum(rev[`${side}TotalWeeks`]);

  // Hidden fetches from Program Info
  const orderKg = toNum(programInfo?.agreedOrderFromCustomerKg);
  const surfaceArea = toNum(programInfo?.plannedSurfaceArea);

  // Additional revenue is present on the Actual (female) column only
  const additional = side === "female" ? toNum(rev.additionalRevenue) : null;

  const contractRevenue = mul(unitPrice, orderKg);
  const totalRevenue = add(contractRevenue, additional);
  const totalRevenuePerSqm = div(totalRevenue, surfaceArea);
  const totalRevenuePerSqmWk = div(totalRevenuePerSqm, weeks);

  return { contractRevenue, totalRevenue, totalRevenuePerSqm, totalRevenuePerSqmWk };
}

/**
 * Pollination Estimated Yield (kg).
 * estimated_yield = (avg_seeds_fruit * fruits_plant * (realized_no_of_plants / 1000)) / no_of_seeds_per_gram.
 * `ctx` supplies realizedPlants from Production.
 */
export function pollinationEstimatedYield(poll: Vals, ctx: Vals | null): number | null {
  const fruitsPerPlant = toNum(poll.fruitsPerPlant);
  const seedsPerFruit = toNum(poll.avgSeedsPerFruit);
  const seedsPerGram = toNum(poll.seedsPerGram);
  const realizedPlants = toNum(ctx?.realizedPlants);

  const yieldNumerator = mul(mul(seedsPerFruit, fruitsPerPlant), div(realizedPlants, 1000));
  return div(yieldNumerator, seedsPerGram);
}

/**
 * Post-Harvest derived figures.
 * `ctx` supplies realizedSurfaceArea + realizedPlants (Production) and
 * agreedGramPerPlant (Program Info).
 */
export function postHarvestComputations(ph: Vals, ctx: Vals | null) {
  const totalKgs = toNum(ph.totalKgs);

  // Directly retrieve the harvesting end week number
  const harvestingEndWeekNo = toNum(ph.harvestEndDate);

  // Hidden fetches
  const agreedOrderFromCustomer = toNum(ctx?.agreedOrderFromCustomerKg);
  const realizedSurfaceArea = toNum(ctx?.realizedSurfaceArea);
  const realizedNoOfPlants = toNum(ctx?.realizedPlants);
  const actualPlantingWeek = toNum(ctx?.actualPlantingWeek);

  // Calculations
  const actualYieldPct = mul(div(totalKgs, agreedOrderFromCustomer), 100);
  const gramsPerSqm = mul(div(totalKgs, realizedSurfaceArea), 1000);
  const gramsPerPlant = mul(div(totalKgs, realizedNoOfPlants), 1000);
  const netWeeks =
    harvestingEndWeekNo !== null && actualPlantingWeek !== null
      ? harvestingEndWeekNo - actualPlantingWeek
      : null;
  const actualGrPerSqmWk = div(gramsPerSqm, netWeeks);

  return { gramsPerSqm, gramsPerPlant, actualYieldPct, netWeeks, actualGrPerSqmWk };
}

/** Seeds Quality %G = Good1 + Good2. */
export function seedsQualityGerminationPct(sq: Vals): number | null {
  return add(toNum(sq.good1), toNum(sq.good2));
}

/** Harvest record gr/m2 = kg × 1000 ÷ row m2. */
export function harvestGrPerM2(row: Vals): number | null {
  return div(mul(toNum(row.kg), 1000), toNum(row.rowM2));
}

/** Germination Test total = Good + Small + Too small + Abnormal + Rotting + No Ger. */
export function germinationTestTotal(gt: Vals): number | null {
  const parts = [gt.good, gt.small, gt.tooSmall, gt.abnormal, gt.rotting, gt.noGer].map(toNum);
  if (parts.every((p) => p === null)) return null;
  return parts.reduce<number>((sum, p) => sum + (p ?? 0), 0);
}

/** Compute Program Info derived fields dynamically from raw inputs. */
export function computeProgramInfoDerivedFields(
  vals: Record<string, unknown>
): Record<string, unknown> {
  const malePlants = toNum(vals.malePlannedPlants);
  const femalePlants = toNum(vals.femalePlannedPlants);
  const totalPlants = add(malePlants, femalePlants);

  const femalePlantsPerRow = toNum(vals.femalePlannedPlantsPerRow);
  const malePlantsPerRow = toNum(vals.malePlannedPlantsPerRow);
  const plantsPerRow = femalePlantsPerRow !== null ? femalePlantsPerRow : malePlantsPerRow;
  const maleDensity = div(malePlantsPerRow, 32);
  const femaleDensity = div(femalePlantsPerRow, 32);
  const density = femaleDensity !== null ? femaleDensity : maleDensity;

  const agreedGramPerPlant = toNum(vals.agreedGramPerPlant);
  const baseYieldKg = toNum(vals.baseYieldKg);

  // 1. Planned Surface Area = planned_no_of_plants / planned_plants_per_m2
  const plannedSurfaceArea = div(totalPlants, density);

  // 2. Planned No of Rows = planned_no_of_plants / planned_plants_per_row
  const plannedNoOfRowsRaw = div(totalPlants, plantsPerRow);
  const plannedNoOfRows = plannedNoOfRowsRaw !== null ? Math.round(plannedNoOfRowsRaw) : null;

  // 3. grams / m2 = (agreed Gram per plant / base yield) * 100
  const gramsPerSqm = mul(div(agreedGramPerPlant, baseYieldKg), 100);

  // 4. Agreed Order (kg) = (Planned No of Plants / 1000) * Agreed Gram per plant
  const agreedOrderFromCustomerKg = mul(div(totalPlants, 1000), agreedGramPerPlant);

  return {
    ...vals,
    malePlannedPlantsPerSqm: maleDensity !== null ? maleDensity : vals.malePlannedPlantsPerSqm,
    femalePlannedPlantsPerSqm:
      femaleDensity !== null ? femaleDensity : vals.femalePlannedPlantsPerSqm,
    plannedSurfaceArea: plannedSurfaceArea !== null ? plannedSurfaceArea : vals.plannedSurfaceArea,
    plannedNoOfRows: plannedNoOfRows !== null ? plannedNoOfRows : vals.plannedNoOfRows,
    gramsPerSqm: gramsPerSqm !== null ? gramsPerSqm : vals.gramsPerSqm,
    agreedOrderFromCustomerKg:
      agreedOrderFromCustomerKg !== null
        ? agreedOrderFromCustomerKg
        : vals.agreedOrderFromCustomerKg,
  };
}

/** Compute Nursery derived fields dynamically from raw inputs and programInfo context. */
export function computeNurseryDerivedFields(
  vals: Record<string, unknown>,
  programInfo: Record<string, unknown> | null
): Record<string, unknown> {
  const malePlants = toNum(vals.maleActualPlantsPlanted);
  const femalePlants = toNum(vals.femaleActualPlantsPlanted);

  const malePlantsPerRow = toNum(vals.maleActualPlantsPerRow);
  const femalePlantsPerRow = toNum(vals.femaleActualPlantsPerRow);

  const malePlannedDensity = toNum(programInfo?.malePlannedPlantsPerSqm);
  const femalePlannedDensity = toNum(programInfo?.femalePlannedPlantsPerSqm);

  // actual_no_of_rows_planted = actual_no_of_plants_planted / actual_plants_per_row_planted
  const maleRows = div(malePlants, malePlantsPerRow);
  const femaleRows = div(femalePlants, femalePlantsPerRow);

  // actual_surface_area_planted = actual_no_of_plants_planted / planned_plants_per_m2
  const maleArea = div(malePlants, malePlannedDensity);
  const femaleArea = div(femalePlants, femalePlannedDensity);

  return {
    ...vals,
    maleActualRowsPlanted: maleRows !== null ? maleRows : vals.maleActualRowsPlanted,
    femaleActualRowsPlanted: femaleRows !== null ? femaleRows : vals.femaleActualRowsPlanted,
    maleActualSurfaceArea: maleArea !== null ? maleArea : vals.maleActualSurfaceArea,
    femaleActualSurfaceArea: femaleArea !== null ? femaleArea : vals.femaleActualSurfaceArea,
  };
}

/** Compute Production derived fields dynamically by carrying over Nursery and ProgramInfo states. */
export function computeProductionDerivedFields(
  vals: Record<string, unknown>,
  nursery: Record<string, unknown> | null,
  programInfo: Record<string, unknown> | null
): Record<string, unknown> {
  const plants = toNum(nursery?.femaleActualPlantsPlanted);
  const rows = toNum(nursery?.femaleActualRowsPlanted);
  const surfaceArea = toNum(nursery?.femaleActualSurfaceArea);
  const density = toNum(programInfo?.femalePlannedPlantsPerSqm);

  return {
    ...vals,
    realizedPlants: plants !== null ? Math.round(plants) : vals.realizedPlants,
    realizedRows: rows !== null ? Math.round(rows) : vals.realizedRows,
    realizedSurfaceArea: surfaceArea !== null ? surfaceArea : vals.realizedSurfaceArea,
    realizedPlantsPerSqm: density !== null ? density : vals.realizedPlantsPerSqm,
  };
}
