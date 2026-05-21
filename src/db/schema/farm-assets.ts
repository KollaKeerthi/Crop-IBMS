import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";

export const geometryTypeEnum = pgEnum("geometry_type", ["Point", "Polygon", "LineString"]);

export const farmAssets = pgTable("farm_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(), // well, sensor, storage, road, etc.
  name: text("name"),
  geometryType: geometryTypeEnum("geometry_type").notNull().default("Point"),
  coordinates: jsonb("coordinates").notNull(), // GeoJSON coordinates
  properties: jsonb("properties"), // arbitrary key-value metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
