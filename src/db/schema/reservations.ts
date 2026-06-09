import { boolean, index, integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { activeTimes } from "./active-times";
import { blockMaster } from "./block-master";
import { cropTypes } from "./crop-types";
import { crops } from "./crops";
import { farms } from "./farms";
import { productionTypes } from "./production-types";
import { seasons } from "./seasons";

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("normal"), // 'normal' | 'empty'
    status: text("status").notNull().default("new"), // 'new' | 'active' | 'completed'
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
    startWeek: integer("start_week"), // used by empty-type reservations
    noOfPlantsFemale: real("no_of_plants_female"),
    plantsPerM2: real("plants_per_m2"),
    surfaceFemale: real("surface_female"),
    surfaceMale: real("surface_male"),
    mfSameBlock: boolean("mf_same_block").notNull().default(false),
    totalSurface: real("total_surface"),
    reservationRef: text("reservation_ref"),
    reason: text("reason"), // used by empty-type reservations
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("reservations_farm_id_idx").on(table.farmId),
    index("reservations_year_idx").on(table.year),
    index("reservations_block_id_idx").on(table.blockId),
    index("reservations_crop_id_idx").on(table.cropId),
  ]
);
