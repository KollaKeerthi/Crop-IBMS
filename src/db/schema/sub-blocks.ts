import { integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { blocks } from "./blocks";

export const subBlocks = pgTable("sub_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockId: uuid("block_id")
    .notNull()
    .references(() => blocks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rows: integer("rows"),
  rowLengthM: real("row_length_m"),
  rowWidthM: real("row_width_m"),
  areaSqm: real("area_sqm"),
  suitableCrops: jsonb("suitable_crops"), // array of crop IDs
  boundary: jsonb("boundary"), // GeoJSON Polygon
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
