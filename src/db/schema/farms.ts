import { jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const farms = pgTable("farms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location"),
  address: text("address"),
  country: text("country"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  boundary: jsonb("boundary"), // GeoJSON Polygon
  areaSqm: real("area_sqm"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
