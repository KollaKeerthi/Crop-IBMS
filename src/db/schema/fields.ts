import { integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";

export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  areaSqm: real("area_sqm"),
  noOfBlocks: integer("no_of_blocks").default(0),
  boundary: jsonb("boundary"), // GeoJSON Polygon
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
