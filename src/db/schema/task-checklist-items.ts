import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";

export const taskChecklistItems = pgTable("task_checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
