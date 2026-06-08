import { index, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropVarieties } from "./crop-varieties";
import { seasons } from "./seasons";
import { blockMaster } from "./block-master";
import { subBlocks } from "./sub-blocks";

export const plantingStatusEnum = pgEnum("planting_status", [
  "Planned",
  "Nursery",
  "Planted",
  "Growing",
  "Harvested",
  "Cancelled",
]);

export const plantingMethodEnum = pgEnum("planting_method", [
  "Direct",
  "Transplant",
  "Cutting",
  "Seed",
]);

export const plantings = pgTable(
  "plantings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
    varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
    seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
    blockMasterId: uuid("block_master_id").references(() => blockMaster.id, {
      onDelete: "set null",
    }),
    subBlockId: uuid("sub_block_id").references(() => subBlocks.id, { onDelete: "set null" }),
    locationType: text("location_type"),
    status: plantingStatusEnum("status").notNull().default("Planned"),
    plantingMethod: plantingMethodEnum("planting_method"),
    nurseryStartDate: timestamp("nursery_start_date", { mode: "date" }),
    fieldPlantingDate: timestamp("field_planting_date", { mode: "date" }),
    firstHarvestDate: timestamp("first_harvest_date", { mode: "date" }),
    harvestEndDate: timestamp("harvest_end_date", { mode: "date" }),
    numRows: real("num_rows"),
    spacingM: real("spacing_m"),
    areaSqm: real("area_sqm"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("plantings_farm_id_idx").on(table.farmId),
    index("plantings_crop_id_idx").on(table.cropId),
    index("plantings_season_id_idx").on(table.seasonId),
    index("plantings_block_master_id_idx").on(table.blockMasterId),
    index("plantings_status_idx").on(table.status),
  ]
);
