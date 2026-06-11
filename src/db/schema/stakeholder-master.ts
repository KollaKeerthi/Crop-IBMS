import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";

export const stakeholderMaster = pgTable("stakeholder_master", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
