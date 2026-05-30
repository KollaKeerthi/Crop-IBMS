import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { crops } from "./crops";

export const cropTypes = pgTable("crop_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropId: uuid("crop_id")
    .notNull()
    .references(() => crops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  colour: text("colour"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
