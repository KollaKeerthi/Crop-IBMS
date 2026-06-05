import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { crops } from "./crops";

export const cropVarietyGenderEnum = pgEnum("crop_variety_gender", ["Male", "Female"]);

export const cropVarieties = pgTable("crop_varieties", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropId: uuid("crop_id")
    .notNull()
    .references(() => crops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  gender: cropVarietyGenderEnum("gender"),
  colourDescription: text("colour_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
