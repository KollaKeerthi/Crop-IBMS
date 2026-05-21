import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { users } from "./users";

export const recurrenceTypeEnum = pgEnum("recurrence_type", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }),
  startTime: text("start_time"),
  endTime: text("end_time"),
  allDay: boolean("all_day").notNull().default(false),
  recurrenceType: recurrenceTypeEnum("recurrence_type").notNull().default("none"),
  recurrenceData: jsonb("recurrence_data"), // interval, days, endDate, count
  googleEventId: text("google_event_id"),
  outlookEventId: text("outlook_event_id"),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
