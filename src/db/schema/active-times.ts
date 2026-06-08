import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropVarieties } from "./crop-varieties";
import { seasons } from "./seasons";
import { productionTypes } from "./production-types";

export const activeTimes = pgTable(
  "active_times",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
    varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
    seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
    productionTypeId: uuid("production_type_id").references(() => productionTypes.id, {
      onDelete: "set null",
    }),
    leadTimeType: text("lead_time_type"),
    // All timeline fields are week numbers (integers) relative to season start
    materialArrival: integer("material_arrival"),
    sowingMale: integer("sowing_male"),
    sowingFemale: integer("sowing_female"),
    plantingMale: integer("planting_male"),
    plantingFemale: integer("planting_female"),
    pollinationStart: integer("pollination_start"),
    pollinationEnd: integer("pollination_end"),
    harvestingStart: integer("harvesting_start"),
    harvestingEnd: integer("harvesting_end"),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("active_times_farm_id_idx").on(table.farmId),
    index("active_times_crop_id_idx").on(table.cropId),
    index("active_times_season_id_idx").on(table.seasonId),
  ]
);
