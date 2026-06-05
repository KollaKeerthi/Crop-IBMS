import { pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { users } from "./users";
import { crops } from "./crops";

export const taskStatusEnum = pgEnum("task_status", [
  "Pending",
  "InProgress",
  "Completed",
  "Cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", ["Low", "Medium", "High", "Urgent"]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  locationType: text("location_type"),
  blockMasterId: uuid("block_master_id"),
  cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
  associatedTo: text("associated_to"),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  priority: taskPriorityEnum("priority").notNull().default("Medium"),
  status: taskStatusEnum("status").notNull().default("Pending"),
  dueDate: timestamp("due_date", { mode: "date" }),
  startDate: timestamp("start_date", { mode: "date" }),
  repeatRule: text("repeat_rule"),
  estimatedHours: real("estimated_hours"),
  color: text("color"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
