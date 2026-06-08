import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { crops } from "./crops";

export const cropTypes = pgTable(
  "crop_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropId: uuid("crop_id")
      .notNull()
      .references(() => crops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    colour: text("colour"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // Composite unique index on (crop_id, id) — required target for composite FK
    // references from crop_data and enables efficient "is this type mine?" lookups.
    uniqueIndex("crop_types_crop_id_id_idx").on(table.cropId, table.id),
  ]
);
