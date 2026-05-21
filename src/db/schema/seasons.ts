import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  startDate: timestamp("start_date", { mode: "date" }),
  endDate: timestamp("end_date", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
