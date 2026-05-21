import { integer, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { farms } from "./farms";
import { crops } from "./crops";
import { cropTypes } from "./crop-types";
import { cropVarieties } from "./crop-varieties";
import { seasons } from "./seasons";
import { users } from "./users";

export const sexExpressionEnum = pgEnum("sex_expression", ["Male", "Female", "Bisexual"]);

export const cropData = pgTable("crop_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  cropId: uuid("crop_id").references(() => crops.id, { onDelete: "set null" }),
  cropTypeId: uuid("crop_type_id").references(() => cropTypes.id, { onDelete: "set null" }),
  varietyId: uuid("variety_id").references(() => cropVarieties.id, { onDelete: "set null" }),
  seasonId: uuid("season_id").references(() => seasons.id, { onDelete: "set null" }),
  block: text("block"),
  fieldName: text("field_name"),
  fieldCode: text("field_code"),
  sexExpression: sexExpressionEnum("sex_expression"),
  contractNo: text("contract_no"),
  headerNo: text("header_no"),
  customerCode: text("customer_code"),
  contractRef: text("contract_ref"),
  status: text("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Program Info — planting specifications
export const programInfo = pgTable("program_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  batchNo: text("batch_no"),
  plantingDate: timestamp("planting_date", { mode: "date" }),
  malePlantCount: integer("male_plant_count"),
  femalePlantCount: integer("female_plant_count"),
  surfaceAreaSqm: real("surface_area_sqm"),
  maleDensity: real("male_density"),
  femaleDensity: real("female_density"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Nursery
export const nursery = pgTable("nursery", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date", { mode: "date" }),
  endDate: timestamp("end_date", { mode: "date" }),
  seedlingsCount: integer("seedlings_count"),
  germinationRate: real("germination_rate"),
  data: jsonb("data"), // flexible additional fields
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Production, Pollination, Post-Harvest, Seeds Quality, Harvest, Germination, Planting Records
// Using JSONB for flexibility on highly variable schemas
export const cropDataModules = pgTable("crop_data_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  moduleType: text("module_type").notNull(), // production | pollination | post_harvest | seeds_quality | harvest | germination | planting_records | post_harvest_summary | revenue
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Performance per person
export const performancePerPerson = pgTable("performance_per_person", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropDataId: uuid("crop_data_id")
    .notNull()
    .references(() => cropData.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").references(() => users.id, { onDelete: "set null" }),
  date: timestamp("date", { mode: "date" }),
  data: jsonb("data"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Media Attachments
export const mediaAttachments = pgTable("media_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // crop_data | task | farm | etc.
  entityId: uuid("entity_id").notNull(),
  url: text("url").notNull(),
  cloudinaryId: text("cloudinary_id"),
  name: text("name"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
