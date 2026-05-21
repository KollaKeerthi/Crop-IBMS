import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const productionTypes = pgTable("production_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
