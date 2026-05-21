import { integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";

export const blockMaster = pgTable("block_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id"),
  greenhouseId: uuid("greenhouse_id"),
  blockName: text("block_name").notNull(),
  subBlockName: text("sub_block_name"),
  areaSqm: real("area_sqm"),
  rows: integer("rows"),
  rowLengthM: real("row_length_m"),
  rowWidthM: real("row_width_m"),
  suitableCrops: jsonb("suitable_crops"), // array of crop IDs
  indexStarts: integer("index_starts").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
