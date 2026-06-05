import { integer, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropTypes } from "./crop-types";
import { cropVarieties } from "./crop-varieties";
import { seasons } from "./seasons";
import { users } from "./users";

export const sexExpressionEnum = pgEnum("sex_expression", ["Male", "Female", "Bisexual"]);

export const cropData = pgTable("crop_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
  cropTypeId: uuid("crop_type_id").references(() => cropTypes.id, { onDelete: "set null" }),
  varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
  block: text("block"),
  fieldName: text("field_name"),
  fieldCode: text("field_code"),
  sexExpression: sexExpressionEnum("sex_expression"),
  contractNo: text("contract_no"),
  headerNo: text("header_no"),
  customerCode: text("customer_code"),
  contractRef: text("contract_ref"),
  status: text("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Program Info - planned planting specifications (Male / Female columns)
export const programInfo = pgTable("program_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  // Batch
  maleBatchNo: text("male_batch_no"),
  femaleBatchNo: text("female_batch_no"),
  // Planned dates
  malePlannedSowingDate: timestamp("male_planned_sowing_date", { mode: "date" }),
  femalePlannedSowingDate: timestamp("female_planned_sowing_date", { mode: "date" }),
  malePlannedPlantingDate: timestamp("male_planned_planting_date", { mode: "date" }),
  femalePlannedPlantingDate: timestamp("female_planned_planting_date", { mode: "date" }),
  // Planned plant counts / densities
  malePlannedPlants: integer("male_planned_plants"),
  femalePlannedPlants: integer("female_planned_plants"),
  malePlannedPlantsPerRow: real("male_planned_plants_per_row"),
  femalePlannedPlantsPerRow: real("female_planned_plants_per_row"),
  malePlannedPlantsPerSqm: real("male_planned_plants_per_sqm"),
  femalePlannedPlantsPerSqm: real("female_planned_plants_per_sqm"),
  plannedSurfaceArea: real("planned_surface_area"),
  plannedNoOfRows: integer("planned_no_of_rows"),
  // Yield parameters (female side per sheet)
  proposedGramPerPlant: real("proposed_gram_per_plant"),
  agreedGramPerPlant: real("agreed_gram_per_plant"),
  baseYieldKg: real("base_yield_kg"),
  gramsPerSqm: real("grams_per_sqm"),
  // Actual prep / schedule
  materialArrivalDate: timestamp("material_arrival_date", { mode: "date" }),
  blockPrepStartDate: timestamp("block_prep_start_date", { mode: "date" }),
  blockPrepEndDate: timestamp("block_prep_end_date", { mode: "date" }),
  productionYear: integer("production_year"),
  // Order
  maleRequestedQuantity: real("male_requested_quantity"),
  femaleRequestedQuantity: real("female_requested_quantity"),
  agreedOrderFromCustomerKg: real("agreed_order_from_customer_kg"),
  requestedDeliveryDate: timestamp("requested_delivery_date", { mode: "date" }),
  archiveStatus: text("archive_status"),
  remarksFromCustomer: text("remarks_from_customer"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Revenue - contract & realised revenue (Male / Female columns)
export const revenue = pgTable("revenue", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  maleTotalWeeks: integer("male_total_weeks"),
  femaleTotalWeeks: integer("female_total_weeks"),
  maleAgreedUnitPrice: real("male_agreed_unit_price"),
  femaleAgreedUnitPrice: real("female_agreed_unit_price"),
  additionalRevenue: real("additional_revenue"),
  plannedRemarks: text("planned_remarks"),
  actualRemarks: text("actual_remarks"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Nursery - actual sowing / planting (Male / Female columns)
export const nursery = pgTable("nursery", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  maleActualSowingDate: timestamp("male_actual_sowing_date", { mode: "date" }),
  femaleActualSowingDate: timestamp("female_actual_sowing_date", { mode: "date" }),
  maleGerminationPct: real("male_germination_pct"),
  femaleGerminationPct: real("female_germination_pct"),
  maleActualPlantingDate: timestamp("male_actual_planting_date", { mode: "date" }),
  femaleActualPlantingDate: timestamp("female_actual_planting_date", { mode: "date" }),
  actualPlantingWeek: integer("actual_planting_week"),
  maleActualPlantsPlanted: integer("male_actual_plants_planted"),
  femaleActualPlantsPlanted: integer("female_actual_plants_planted"),
  maleActualPlantsPerRow: real("male_actual_plants_per_row"),
  femaleActualPlantsPerRow: real("female_actual_plants_per_row"),
  maleActualRowsPlanted: real("male_actual_rows_planted"),
  femaleActualRowsPlanted: real("female_actual_rows_planted"),
  maleActualSurfaceArea: real("male_actual_surface_area"),
  femaleActualSurfaceArea: real("female_actual_surface_area"),
  remarksFromCustomer: text("remarks_from_customer"),
  recommendations: text("recommendations"),
  data: jsonb("data"), // flexible additional fields
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Production - realised planting + environment
export const production = pgTable("production", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  realizedPlants: integer("realized_plants"),
  realizedRows: integer("realized_rows"),
  realizedSurfaceArea: real("realized_surface_area"),
  realizedPlantsPerSqm: real("realized_plants_per_sqm"),
  avgTemperature: real("avg_temperature"),
  avgRadiation: real("avg_radiation"),
  avgHumidity: real("avg_humidity"),
  remarks: text("remarks"),
  recommendations: text("recommendations"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pollination
export const pollination = pgTable("pollination", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  pollinationStart: timestamp("pollination_start", { mode: "date" }),
  pollinationEnd: timestamp("pollination_end", { mode: "date" }),
  supervisor: text("supervisor"),
  avgSeedsPerFruit: real("avg_seeds_per_fruit"),
  fruitsPerPlant: real("fruits_per_plant"),
  seedsPerGram: real("seeds_per_gram"),
  expectedHarvestDate: timestamp("expected_harvest_date", { mode: "date" }),
  avgTempDuringPollination: real("avg_temp_during_pollination"),
  lightDuringPollination: real("light_during_pollination"),
  avgHumidityDuringPollination: real("avg_humidity_during_pollination"),
  remarks: text("remarks"),
  recommendations: text("recommendations"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Post Harvest
export const postHarvest = pgTable("post_harvest", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  harvestStartDate: timestamp("harvest_start_date", { mode: "date" }),
  harvestEndDate: integer("harvest_end_date"),
  plannedShippingDate: timestamp("planned_shipping_date", { mode: "date" }),
  actualShippingDate: timestamp("actual_shipping_date", { mode: "date" }),
  totalNoOfHarvests: integer("total_no_of_harvests"),
  totalKgs: real("total_kgs"),
  netCropCycleWeeks: real("net_crop_cycle_weeks"),
  germinationPct: real("germination_pct"),
  remarks: text("remarks"),
  recommendations: text("recommendations"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Post Harvest Summary
export const postHarvestSummary = pgTable("post_harvest_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }),
  kgs: real("kgs"),
  germinationPct: real("germination_pct"),
  remarks: text("remarks"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Seeds Quality - seed count breakdown (%G computed in-app)
export const seedsQuality = pgTable("seeds_quality", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  totalSeedsSown: integer("total_seeds_sown"),
  good1: integer("good1"),
  good2: integer("good2"),
  abnormal: integer("abnormal"),
  tooSmall: integer("too_small"),
  nonGerminated: integer("non_germinated"),
  cropAssessmentScore: real("crop_assessment_score"),
  kgCustomerAfterCleaning: real("kg_customer_after_cleaning"),
  remarks: text("remarks"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SQ Breakdown - germination breakdown (KG's vs Germination %)
export const sqBreakdown = pgTable("sq_breakdown", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  germGoodKg: real("germ_good_kg"),
  germGoodPct: real("germ_good_pct"),
  germLowKg: real("germ_low_kg"),
  germLowPct: real("germ_low_pct"),
  germCustomerGoodKg: real("germ_customer_good_kg"),
  germCustomerGoodPct: real("germ_customer_good_pct"),
  germCustomerLowKg: real("germ_customer_low_kg"),
  germCustomerLowPct: real("germ_customer_low_pct"),
  germLowExportDate: timestamp("germ_low_export_date", { mode: "date" }),
  inbredPct: real("inbred_pct"),
  offType: real("off_type"),
  recommendations: text("recommendations"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Germination Test - bench test counts (total seeds sown computed in-app)
export const germinationTest = pgTable("germination_test", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  sownDate: timestamp("sown_date", { mode: "date" }),
  finalCountDate: timestamp("final_count_date", { mode: "date" }),
  sownOn: text("sown_on"),
  good: integer("good"),
  small: integer("small"),
  tooSmall: integer("too_small"),
  abnormal: integer("abnormal"),
  rotting: integer("rotting"),
  noGer: integer("no_ger"),
  remarks: text("remarks"),
  empName: text("emp_name"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Harvest, Planting Records - remaining JSONB modules (retired per section)
export const cropDataModules = pgTable("crop_data_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  moduleType: text("module_type").notNull(), // production | pollination | post_harvest | seeds_quality | harvest | germination | planting_records | post_harvest_summary | revenue
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Harvest Details - one row per harvest event (gr/m² computed in-app)
export const harvestRecords = pgTable("harvest_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  harvestDate: timestamp("harvest_date", { mode: "date" }),
  block: text("block"),
  variety: text("variety"),
  code: text("code"),
  rowM2: real("row_m2"),
  rowNo: integer("row_no"),
  empName: text("emp_name"),
  harvestCode: text("harvest_code"),
  kg: real("kg"),
  germinationPct: real("germination_pct"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Performance per person - one row per worker per day
export const performancePerPerson = pgTable("performance_per_person", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").references(() => users.id, { onDelete: "set null" }),
  date: timestamp("date", { mode: "date" }),
  empName: text("emp_name"),
  activity: text("activity"),
  outputQty: real("output_qty"),
  data: jsonb("data"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Media Attachments
export const mediaAttachments = pgTable("media_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // crop_data | task | farm | etc.
  entityId: uuid("entity_id").notNull(),
  url: text("url").notNull(),
  cloudinaryId: text("cloudinary_id"),
  name: text("name"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
