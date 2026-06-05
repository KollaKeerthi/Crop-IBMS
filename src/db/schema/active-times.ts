import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropVarieties } from "./crop-varieties";
import { seasons } from "./seasons";

export const activeTimes = pgTable("active_times", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
  varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
  productionTypeId: uuid("production_type_id"),
  leadTimeType: text("lead_time_type"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
