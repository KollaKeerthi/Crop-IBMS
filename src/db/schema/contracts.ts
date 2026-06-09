import { boolean, index, integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { activeTimes } from "./active-times";
import { blockMaster } from "./block-master";
import { cropTypes } from "./crop-types";
import { crops } from "./crops";
import { farms } from "./farms";
import { productionTypes } from "./production-types";
import { reservations } from "./reservations";
import { seasons } from "./seasons";

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("active"), // 'active' | 'completed'
    isAllocated: boolean("is_allocated").notNull().default(false),
    productionTypeId: uuid("production_type_id").references(() => productionTypes.id, {
      onDelete: "set null",
    }),
    cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
    cropTypeId: uuid("crop_type_id").references(() => cropTypes.id, { onDelete: "set null" }),
    blockId: uuid("block_id").references(() => blockMaster.id, { onDelete: "set null" }),
    activeTimeId: uuid("active_time_id").references(() => activeTimes.id, { onDelete: "set null" }),
    seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
    year: integer("year").notNull(),
    pollinationStartWeek: integer("pollination_start_week"),
    materialArrivalWeek: integer("material_arrival_week"),
    plantingWeek: integer("planting_week"),
    endWeek: integer("end_week"),
    noOfPlantsFemale: real("no_of_plants_female"),
    plantsPerM2: real("plants_per_m2"),
    surfaceFemale: real("surface_female"),
    surfaceMale: real("surface_male"),
    mfSameBlock: boolean("mf_same_block").notNull().default(false),
    totalSurface: real("total_surface"),
    reservationRef: text("reservation_ref"),
    // contract-specific fields
    baseYield: real("base_yield"),
    requestedQty: real("requested_qty"),
    unitPrice: real("unit_price"),
    contractRevenue: real("contract_revenue"),
    absContractNo: text("abs_contract_no"),
    absHeaderNo: text("abs_header_no"),
    nlCode: text("nl_code"),
    contractRef: text("contract_ref"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("contracts_farm_id_idx").on(table.farmId),
    index("contracts_year_idx").on(table.year),
    index("contracts_block_id_idx").on(table.blockId),
    index("contracts_reservation_id_idx").on(table.reservationId),
  ]
);
