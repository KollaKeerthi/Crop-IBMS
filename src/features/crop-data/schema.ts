import { z } from "zod";

export const SexExpressionSchema = z.enum([
  "Gynoecious",
  "Monoecious",
  "Andromonoecious",
  "Semi-gynoecious",
  "2n",
  "4n",
]);

export const CreateCropDataInputSchema = z.object({
  farmId: z.string().uuid(),
  cropId: z.string().uuid().optional(),
  cropTypeId: z.string().uuid().optional(),
  varietyId: z.string().uuid().optional(),
  seasonId: z.string().uuid().optional(),
  block: z.string().optional(),
  fieldName: z.string().optional(),
  fieldCode: z.string().optional(),
  sexExpression: SexExpressionSchema.optional(),
  contractNo: z.string().optional(),
  headerNo: z.string().optional(),
  customerCode: z.string().optional(),
  contractRef: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateCropDataInput = z.infer<typeof CreateCropDataInputSchema>;

export const UpdateCropDataInputSchema = CreateCropDataInputSchema.partial().omit({ farmId: true });
export type UpdateCropDataInput = z.infer<typeof UpdateCropDataInputSchema>;

// Shared optional field helpers. Forms send "" for empty text/date inputs and
// undefined for empty number inputs; "" dates are coerced to null in mutations.
const oText = z.string().nullish();
const oDate = z.string().nullish();
const oNum = z.number().nullish();
const oInt = z.number().int().nullish();

export const PROGRAM_INFO_DATE_FIELDS = [
  "malePlannedSowingDate",
  "femalePlannedSowingDate",
  "malePlannedPlantingDate",
  "femalePlannedPlantingDate",
  "materialArrivalDate",
  "blockPrepStartDate",
  "blockPrepEndDate",
  "requestedDeliveryDate",
] as const;

export const UpdateProgramInfoInputSchema = z.object({
  maleBatchNo: oText,
  femaleBatchNo: oText,
  malePlannedSowingDate: oDate,
  femalePlannedSowingDate: oDate,
  malePlannedPlantingDate: oDate,
  femalePlannedPlantingDate: oDate,
  malePlannedPlants: oInt,
  femalePlannedPlants: oInt,
  malePlannedPlantsPerRow: oNum,
  femalePlannedPlantsPerRow: oNum,
  malePlannedPlantsPerSqm: oNum,
  femalePlannedPlantsPerSqm: oNum,
  plannedSurfaceArea: oNum,
  plannedNoOfRows: oInt,
  proposedGramPerPlant: oNum,
  agreedGramPerPlant: oNum,
  baseYieldKg: oNum,
  gramsPerSqm: oNum,
  materialArrivalDate: oDate,
  blockPrepStartDate: oDate,
  blockPrepEndDate: oDate,
  productionYear: oInt,
  maleRequestedQuantity: oNum,
  femaleRequestedQuantity: oNum,
  agreedOrderFromCustomerKg: oNum,
  requestedDeliveryDate: oDate,
  archiveStatus: oText,
  remarksFromCustomer: oText,
  notes: oText,
});
export type UpdateProgramInfoInput = z.infer<typeof UpdateProgramInfoInputSchema>;

export const REVENUE_DATE_FIELDS = [] as const;

export const UpdateRevenueInputSchema = z.object({
  maleTotalWeeks: oInt,
  femaleTotalWeeks: oInt,
  maleAgreedUnitPrice: oNum,
  femaleAgreedUnitPrice: oNum,
  additionalRevenue: oNum,
  plannedRemarks: oText,
  actualRemarks: oText,
});
export type UpdateRevenueInput = z.infer<typeof UpdateRevenueInputSchema>;

export const NURSERY_DATE_FIELDS = [
  "maleActualSowingDate",
  "femaleActualSowingDate",
  "maleActualPlantingDate",
  "femaleActualPlantingDate",
] as const;

export const UpdateNurseryInputSchema = z.object({
  maleActualSowingDate: oDate,
  femaleActualSowingDate: oDate,
  maleGerminationPct: oNum,
  femaleGerminationPct: oNum,
  maleActualPlantingDate: oDate,
  femaleActualPlantingDate: oDate,
  actualPlantingWeek: oInt,
  maleActualPlantsPlanted: oInt,
  femaleActualPlantsPlanted: oInt,
  maleActualPlantsPerRow: oNum,
  femaleActualPlantsPerRow: oNum,
  maleActualRowsPlanted: oNum,
  femaleActualRowsPlanted: oNum,
  maleActualSurfaceArea: oNum,
  femaleActualSurfaceArea: oNum,
  remarksFromCustomer: oText,
  recommendations: oText,
  notes: oText,
});
export type UpdateNurseryInput = z.infer<typeof UpdateNurseryInputSchema>;

export const UpdateModuleInputSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});
export type UpdateModuleInput = z.infer<typeof UpdateModuleInputSchema>;

// ---- Phase 2 single-record sections (generic section system) ----

export const UpdateProductionInputSchema = z.object({
  realizedPlants: oInt,
  realizedRows: oInt,
  realizedSurfaceArea: oNum,
  realizedPlantsPerSqm: oNum,
  avgTemperature: oNum,
  avgRadiation: oNum,
  avgHumidity: oNum,
  remarks: oText,
  recommendations: oText,
});
export type UpdateProductionInput = z.infer<typeof UpdateProductionInputSchema>;

export const POLLINATION_DATE_FIELDS = [
  "pollinationStart",
  "pollinationEnd",
  "expectedHarvestDate",
] as const;
export const UpdatePollinationInputSchema = z.object({
  pollinationStart: oDate,
  pollinationEnd: oDate,
  supervisor: oText,
  avgSeedsPerFruit: oNum,
  fruitsPerPlant: oNum,
  seedsPerGram: oNum,
  expectedHarvestDate: oDate,
  avgTempDuringPollination: oNum,
  lightDuringPollination: oNum,
  avgHumidityDuringPollination: oNum,
  remarks: oText,
  recommendations: oText,
});
export type UpdatePollinationInput = z.infer<typeof UpdatePollinationInputSchema>;

export const POST_HARVEST_DATE_FIELDS = [
  "harvestStartDate",
  "plannedShippingDate",
  "actualShippingDate",
] as const;
export const UpdatePostHarvestInputSchema = z.object({
  harvestStartDate: oDate,
  harvestEndDate: oInt,
  plannedShippingDate: oDate,
  actualShippingDate: oDate,
  totalNoOfHarvests: oInt,
  totalKgs: oNum,
  netCropCycleWeeks: oNum,
  germinationPct: oNum,
  remarks: oText,
  recommendations: oText,
});
export type UpdatePostHarvestInput = z.infer<typeof UpdatePostHarvestInputSchema>;

export const POST_HARVEST_SUMMARY_DATE_FIELDS = ["date"] as const;
export const UpdatePostHarvestSummaryInputSchema = z.object({
  date: oDate,
  kgs: oNum,
  germinationPct: oNum,
  remarks: oText,
});
export type UpdatePostHarvestSummaryInput = z.infer<typeof UpdatePostHarvestSummaryInputSchema>;

// ---- Phase 3 single-record sections ----

export const UpdateSeedsQualityInputSchema = z.object({
  totalSeedsSown: oInt,
  good1: oInt,
  good2: oInt,
  abnormal: oInt,
  tooSmall: oInt,
  nonGerminated: oInt,
  cropAssessmentScore: oNum,
  kgCustomerAfterCleaning: oNum,
  remarks: oText,
});
export type UpdateSeedsQualityInput = z.infer<typeof UpdateSeedsQualityInputSchema>;

export const SQ_BREAKDOWN_DATE_FIELDS = ["germLowExportDate"] as const;
export const UpdateSqBreakdownInputSchema = z.object({
  germGoodKg: oNum,
  germGoodPct: oNum,
  germLowKg: oNum,
  germLowPct: oNum,
  germCustomerGoodKg: oNum,
  germCustomerGoodPct: oNum,
  germCustomerLowKg: oNum,
  germCustomerLowPct: oNum,
  germLowExportDate: oDate,
  inbredPct: oNum,
  offType: oNum,
  recommendations: oText,
});
export type UpdateSqBreakdownInput = z.infer<typeof UpdateSqBreakdownInputSchema>;

export const GERMINATION_TEST_DATE_FIELDS = ["sownDate", "finalCountDate"] as const;
export const UpdateGerminationTestInputSchema = z.object({
  sownDate: oDate,
  finalCountDate: oDate,
  sownOn: oText,
  good: oInt,
  small: oInt,
  tooSmall: oInt,
  abnormal: oInt,
  rotting: oInt,
  noGer: oInt,
  remarks: oText,
  empName: oText,
});
export type UpdateGerminationTestInput = z.infer<typeof UpdateGerminationTestInputSchema>;

// ---- Phase 4 multi-row collections ----

export const HARVEST_RECORD_DATE_FIELDS = ["harvestDate"] as const;
export const HarvestRecordInputSchema = z.object({
  harvestDate: oDate,
  block: oText,
  variety: oText,
  code: oText,
  rowM2: oNum,
  rowNo: oInt,
  empName: oText,
  harvestCode: oText,
  kg: oNum,
  germinationPct: oNum,
  remarks: oText,
});
export type HarvestRecordInput = z.infer<typeof HarvestRecordInputSchema>;

export const PERFORMANCE_DATE_FIELDS = ["date"] as const;
export const PerformanceInputSchema = z.object({
  date: oDate,
  empName: oText,
  activity: oText,
  outputQty: oNum,
  notes: oText,
});
export type PerformanceInput = z.infer<typeof PerformanceInputSchema>;

export const CropDataSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropId: z.string().uuid().nullable(),
  cropName: z.string().nullable(),
  varietyName: z.string().nullable(),
  seasonName: z.string().nullable(),
  block: z.string().nullable(),
  fieldName: z.string().nullable(),
  fieldCode: z.string().nullable(),
  sexExpression: z.string().nullable(),
  contractNo: z.string().nullable(),
  headerNo: z.string().nullable(),
  customerCode: z.string().nullable(),
  contractRef: z.string().nullable(),
  status: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type CropData = z.infer<typeof CropDataSchema>;

export const CropDataListSchema = z.array(CropDataSchema);
