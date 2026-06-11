import { integer, pgTable, real, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropTypes } from "./crop-types";
import { productionTypes } from "./production-types";
import { stakeholderMaster } from "./stakeholder-master";

export const densityMaster = pgTable("density_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
  cropTypeId: uuid("crop_type_id").references(() => cropTypes.id, { onDelete: "set null" }),
  productionTypeId: uuid("production_type_id").references(() => productionTypes.id, {
    onDelete: "set null",
  }),
  stakeholderId: uuid("stakeholder_id").references(() => stakeholderMaster.id, {
    onDelete: "set null",
  }),
  year: integer("year"),
  maleDensity: real("male_density"),
  femaleDensity: real("female_density"),
  validFrom: integer("valid_from").notNull().default(1),
  validTo: integer("valid_to").notNull().default(52),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
