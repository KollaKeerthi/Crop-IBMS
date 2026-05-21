import { integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";

export const densityMaster = pgTable("density_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
  productionSiteId: uuid("production_site_id"),
  maleDensity: real("male_density"),
  femaleDensity: real("female_density"),
  spacingM: real("spacing_m"),
  rowSpacingM: real("row_spacing_m"),
  validFrom: integer("valid_from").notNull().default(1),
  validTo: integer("valid_to").notNull().default(52),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
