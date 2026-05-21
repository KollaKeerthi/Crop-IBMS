import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { crops } from "./crops";

export const cropVarieties = pgTable("crop_varieties", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropId: uuid("crop_id")
    .notNull()
    .references(() => crops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
