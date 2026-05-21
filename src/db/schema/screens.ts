import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const screens = pgTable("screens", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // e.g. "tasks.board", "crops.list"
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
