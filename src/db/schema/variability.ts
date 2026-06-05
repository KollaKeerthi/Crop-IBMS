import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { productionTypes } from "./production-types";

export const variabilityKindEnum = pgEnum("variability_kind", ["Fixed", "Flexible"]);

export const variability = pgTable("variability", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id").references(() => farms.id, { onDelete: "cascade" }),
  productionTypeId: uuid("production_type_id")
    .notNull()
    .references(() => productionTypes.id, { onDelete: "cascade" }),
  variability: variabilityKindEnum("variability").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
