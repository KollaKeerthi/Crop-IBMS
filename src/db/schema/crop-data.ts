import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropTypes } from "./crop-types";
import { cropVarieties } from "./crop-varieties";
import { seasons } from "./seasons";
import { users } from "./users";
import { plantings } from "./plantings";
import { blockMaster } from "./block-master";
import { blocks as locationBlocks } from "./blocks";
import { activities } from "./activities";
import { contracts } from "./contracts";

export const sexExpressionEnum = pgEnum("sex_expression", [
  "Male",
  "Female",
  "Bisexual",
  "Gynoecious",
  "Monoecious",
  "Andromonoecious",
  "Semi-gynoecious",
  "2n",
  "4n",
]);

export const cropDataStatusEnum = pgEnum("crop_data_status", ["active", "archived"]);

export const cropData = pgTable(
  "crop_data",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
    cropTypeId: uuid("crop_type_id").references(() => cropTypes.id, { onDelete: "set null" }),
    varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
    seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
    plantingId: uuid("planting_id").references(() => plantings.id, { onDelete: "set null" }),
    contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
    blockMasterId: uuid("block_master_id").references(() => blockMaster.id, {
      onDelete: "set null",
    }),
    locationBlockId: uuid("location_block_id").references(() => locationBlocks.id, {
      onDelete: "set null",
    }),
    block: text("block"),
    fieldName: text("field_name"),
    fieldCode: text("field_code"),
    sexExpression: sexExpressionEnum("sex_expression"),
    contractNo: text("contract_no"),
    headerNo: text("header_no"),
    customerCode: text("customer_code"),
    contractRef: text("contract_ref"),
    status: cropDataStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("crop_data_farm_id_idx").on(table.farmId),
    index("crop_data_crop_id_idx").on(table.cropId),
    index("crop_data_season_id_idx").on(table.seasonId),
    index("crop_data_contract_id_idx").on(table.contractId),
    index("crop_data_location_block_id_idx").on(table.locationBlockId),
    index("crop_data_status_idx").on(table.status),
  ]
);

// Program Info
export const programInfo = pgTable(
  "program_info",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropDataId: uuid("crop_data_id")
      .notNull()
      .references(() => cropData.id, { onDelete: "cascade" }),
    maleBatchNo: text("male_batch_no"),
    femaleBatchNo: text("female_batch_no"),
    malePlannedSowingDate: timestamp("male_planned_sowing_date", { mode: "date" }),
    femalePlannedSowingDate: timestamp("female_planned_sowing_date", { mode: "date" }),
    malePlannedPlantingDate: timestamp("male_planned_planting_date", { mode: "date" }),
    femalePlannedPlantingDate: timestamp("female_planned_planting_date", { mode: "date" }),
    malePlannedPlants: integer("male_planned_plants"),
    femalePlannedPlants: integer("female_planned_plants"),
    malePlannedPlantsPerRow: real("male_planned_plants_per_row"),
    femalePlannedPlantsPerRow: real("female_planned_plants_per_row"),
    malePlannedPlantsPerSqm: real("male_planned_plants_per_sqm"),
    femalePlannedPlantsPerSqm: real("female_planned_plants_per_sqm"),
    plannedSurfaceArea: real("planned_surface_area"),
    plannedNoOfRows: integer("planned_no_of_rows"),
    proposedGramPerPlant: real("proposed_gram_per_plant"),
    agreedGramPerPlant: real("agreed_gram_per_plant"),
    baseYieldKg: real("base_yield_kg"),
    gramsPerSqm: real("grams_per_sqm"),
    materialArrivalDate: timestamp("material_arrival_date", { mode: "date" }),
    blockPrepStartDate: timestamp("block_prep_start_date", { mode: "date" }),
    blockPrepEndDate: timestamp("block_prep_end_date", { mode: "date" }),
    productionYear: integer("production_year"),
    maleRequestedQuantity: real("male_requested_quantity"),
    femaleRequestedQuantity: real("female_requested_quantity"),
    agreedOrderFromCustomerKg: real("agreed_order_from_customer_kg"),
    requestedDeliveryDate: timestamp("requested_delivery_date", { mode: "date" }),
    archiveStatus: text("archive_status"),
    remarksFromCustomer: text("remarks_from_customer"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("program_info_crop_data_id_idx").on(table.cropDataId)]
);

// Revenue
export const revenue = pgTable(
  "revenue",
  {
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
  },
  (table) => [index("revenue_crop_data_id_idx").on(table.cropDataId)]
);

// Nursery
export const nursery = pgTable(
  "nursery",
  {
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
    data: jsonb("data"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("nursery_crop_data_id_idx").on(table.cropDataId)]
);

// Production
export const production = pgTable(
  "production",
  {
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
  },
  (table) => [index("production_crop_data_id_idx").on(table.cropDataId)]
);

// Pollination
export const pollination = pgTable(
  "pollination",
  {
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
  },
  (table) => [index("pollination_crop_data_id_idx").on(table.cropDataId)]
);

// Post Harvest
export const postHarvest = pgTable(
  "post_harvest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropDataId: uuid("crop_data_id")
      .notNull()
      .references(() => cropData.id, { onDelete: "cascade" }),
    harvestStartDate: timestamp("harvest_start_date", { mode: "date" }),
    harvestEndDate: timestamp("harvest_end_date", { mode: "date" }),
    plannedShippingDate: timestamp("planned_shipping_date", { mode: "date" }),
    actualShippingDate: timestamp("actual_shipping_date", { mode: "date" }),
    totalNoOfHarvests: integer("total_no_of_harvests"),
    totalKgs: real("total_kgs"),
    netCropCycleWeeks: real("net_crop_cycle_weeks"),
    germinationPct: real("germination_pct"),
    remarks: text("remarks"),
    recommendations: text("recommendations"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("post_harvest_crop_data_id_idx").on(table.cropDataId)]
);

// Post Harvest Summary
export const postHarvestSummary = pgTable(
  "post_harvest_summary",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropDataId: uuid("crop_data_id")
      .notNull()
      .references(() => cropData.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }),
    kgs: real("kgs"),
    germinationPct: real("germination_pct"),
    remarks: text("remarks"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("post_harvest_summary_crop_data_id_idx").on(table.cropDataId)]
);

// Seeds Quality
export const seedsQuality = pgTable(
  "seeds_quality",
  {
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
  },
  (table) => [index("seeds_quality_crop_data_id_idx").on(table.cropDataId)]
);

// SQ Breakdown
export const sqBreakdown = pgTable(
  "sq_breakdown",
  {
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
  },
  (table) => [index("sq_breakdown_crop_data_id_idx").on(table.cropDataId)]
);

// Germination Test
export const germinationTest = pgTable(
  "germination_test",
  {
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
  },
  (table) => [index("germination_test_crop_data_id_idx").on(table.cropDataId)]
);

// Crop Data Modules (flexible JSONB)
export const cropDataModules = pgTable(
  "crop_data_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropDataId: uuid("crop_data_id")
      .notNull()
      .references(() => cropData.id, { onDelete: "cascade" }),
    moduleType: text("module_type").notNull(),
    data: jsonb("data").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("crop_data_modules_crop_data_id_idx").on(table.cropDataId)]
);

// Harvest Records — one row per harvest event
export const harvestRecords = pgTable(
  "harvest_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropDataId: uuid("crop_data_id")
      .notNull()
      .references(() => cropData.id, { onDelete: "cascade" }),
    varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
    blockMasterId: uuid("block_master_id").references(() => blockMaster.id, {
      onDelete: "set null",
    }),
    harvestDate: timestamp("harvest_date", { mode: "date" }),
    code: text("code"),
    rowM2: real("row_m2"),
    rowNo: integer("row_no"),
    empName: text("emp_name"),
    harvestCode: text("harvest_code"),
    kg: real("kg"),
    germinationPct: real("germination_pct"),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("harvest_records_crop_data_id_idx").on(table.cropDataId),
    index("harvest_records_variety_id_idx").on(table.varietyId),
  ]
);

// Performance Per Person — one row per worker per day
export const performancePerPerson = pgTable(
  "performance_per_person",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropDataId: uuid("crop_data_id")
      .notNull()
      .references(() => cropData.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id").references(() => users.id, { onDelete: "set null" }),
    activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
    date: timestamp("date", { mode: "date" }),
    empName: text("emp_name"),
    activity: text("activity"), // freeform label override when activityId is not set
    outputQty: real("output_qty"),
    data: jsonb("data"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("performance_per_person_crop_data_id_idx").on(table.cropDataId),
    index("performance_per_person_worker_id_idx").on(table.workerId),
  ]
);

// Media Attachments
export const mediaAttachments = pgTable(
  "media_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    url: text("url").notNull(),
    cloudinaryId: text("cloudinary_id"),
    teedyDocumentId: text("teedy_document_id"),
    teedyFileId: text("teedy_file_id"),
    name: text("name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("media_attachments_entity_id_idx").on(table.entityId)]
);
