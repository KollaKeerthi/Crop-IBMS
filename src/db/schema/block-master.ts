import { index, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { fields } from "./fields";
import { greenhouses } from "./greenhouses";
import { subBlocks } from "./sub-blocks";

export const blockMaster = pgTable(
  "block_master",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id").references(() => fields.id, { onDelete: "set null" }),
    greenhouseId: uuid("greenhouse_id").references(() => greenhouses.id, { onDelete: "set null" }),
    subBlockId: uuid("sub_block_id").references(() => subBlocks.id, { onDelete: "set null" }),
    blockName: text("block_name").notNull(),
    subBlockName: text("sub_block_name"),
    areaSqm: real("area_sqm"),
    rows: integer("rows"),
    rowLengthM: real("row_length_m"),
    rowWidthM: real("row_width_m"),
    suitableCrops: jsonb("suitable_crops"),
    indexStarts: integer("index_starts").default(1),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("block_master_farm_id_idx").on(table.farmId),
    index("block_master_field_id_idx").on(table.fieldId),
    index("block_master_greenhouse_id_idx").on(table.greenhouseId),
  ]
);
