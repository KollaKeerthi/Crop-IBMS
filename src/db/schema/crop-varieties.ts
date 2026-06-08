import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { crops } from "./crops";

export const cropVarietyGenderEnum = pgEnum("crop_variety_gender", ["Male", "Female"]);

export const cropVarieties = pgTable(
  "crop_varieties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cropId: uuid("crop_id")
      .notNull()
      .references(() => crops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    gender: cropVarietyGenderEnum("gender"),
    colourDescription: text("colour_description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // Composite unique index on (crop_id, id) — mirrors crop_types for symmetry,
    // enables composite FK references and efficient ownership lookups.
    uniqueIndex("crop_varieties_crop_id_id_idx").on(table.cropId, table.id),
  ]
);
