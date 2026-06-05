import { integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { taskPriorityEnum } from "./tasks";

export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").notNull().default("Medium"),
  estimatedHours: real("estimated_hours"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const taskTemplateChecklistItems = pgTable("task_template_checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => taskTemplates.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
