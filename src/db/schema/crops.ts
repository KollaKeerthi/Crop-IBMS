import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const crops = pgTable("crops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  scientificName: text("scientific_name"),
  family: text("family"),
  description: text("description"),
  imageUrl: text("image_url"),
  cloudinaryId: text("cloudinary_id"),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
