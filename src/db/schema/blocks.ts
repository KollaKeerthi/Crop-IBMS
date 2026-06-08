import { index, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";

export const blockParentTypeEnum = pgEnum("block_parent_type", ["field", "greenhouse"]);

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    parentType: blockParentTypeEnum("parent_type").notNull(),
    parentId: uuid("parent_id").notNull(), // field_id or greenhouse_id
    name: text("name").notNull(),
    areaSqm: real("area_sqm"),
    boundary: jsonb("boundary"), // GeoJSON Polygon
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("blocks_farm_id_idx").on(table.farmId),
    index("blocks_parent_id_idx").on(table.parentId),
  ]
);
