import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { activeTimes } from "./active-times";
import { activities } from "./activities";

export const activeTimeActivities = pgTable("active_time_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  activeTimeId: uuid("active_time_id")
    .notNull()
    .references(() => activeTimes.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
  weekNumber: integer("week_number"),
  dayOffset: integer("day_offset"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
