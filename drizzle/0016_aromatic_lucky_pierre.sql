CREATE TYPE "public"."crop_data_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"reservation_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"is_allocated" boolean DEFAULT false NOT NULL,
	"production_type_id" uuid,
	"crop_id" uuid,
	"crop_type_id" uuid,
	"block_id" uuid,
	"active_time_id" uuid,
	"season_id" uuid,
	"year" integer NOT NULL,
	"pollination_start_week" integer,
	"material_arrival_week" integer,
	"planting_week" integer,
	"end_week" integer,
	"no_of_plants_female" real,
	"plants_per_m2" real,
	"surface_female" real,
	"surface_male" real,
	"mf_same_block" boolean DEFAULT false NOT NULL,
	"total_surface" real,
	"reservation_ref" text,
	"base_yield" real,
	"requested_qty" real,
	"unit_price" real,
	"contract_revenue" real,
	"abs_contract_no" text,
	"abs_header_no" text,
	"nl_code" text,
	"contract_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"type" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"production_type_id" uuid,
	"crop_id" uuid,
	"crop_type_id" uuid,
	"block_id" uuid,
	"active_time_id" uuid,
	"season_id" uuid,
	"year" integer NOT NULL,
	"pollination_start_week" integer,
	"material_arrival_week" integer,
	"planting_week" integer,
	"end_week" integer,
	"start_week" integer,
	"no_of_plants_female" real,
	"plants_per_m2" real,
	"surface_female" real,
	"surface_male" real,
	"mf_same_block" boolean DEFAULT false NOT NULL,
	"total_surface" real,
	"reservation_ref" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "screens" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_permissions" CASCADE;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "material_arrival" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "sowing_male" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "sowing_female" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "planting_male" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "planting_female" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "pollination_start" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "pollination_end" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "harvesting_start" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "active_times" ALTER COLUMN "harvesting_end" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "crop_data" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."crop_data_status";--> statement-breakpoint
ALTER TABLE "crop_data" ALTER COLUMN "status" SET DATA TYPE "public"."crop_data_status" USING "status"::"public"."crop_data_status";--> statement-breakpoint
ALTER TABLE "crop_data" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "post_harvest" ALTER COLUMN "harvest_end_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "density_master" ALTER COLUMN "year" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "density_master" ALTER COLUMN "year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "farm_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "resource_type" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "resource_name" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "previous_data" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "new_data" jsonb;--> statement-breakpoint
ALTER TABLE "block_master" ADD COLUMN "sub_block_id" uuid;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "planting_id" uuid;--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "block_master_id" uuid;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD COLUMN "variety_id" uuid;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD COLUMN "block_master_id" uuid;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD COLUMN "activity_id" uuid;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_blocks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "crop_data_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "active_time_activity_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_block_id_block_master_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_active_time_id_active_times_id_fk" FOREIGN KEY ("active_time_id") REFERENCES "public"."active_times"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_block_id_block_master_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_active_time_id_active_times_id_fk" FOREIGN KEY ("active_time_id") REFERENCES "public"."active_times"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contracts_farm_id_idx" ON "contracts" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "contracts_year_idx" ON "contracts" USING btree ("year");--> statement-breakpoint
CREATE INDEX "contracts_block_id_idx" ON "contracts" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "contracts_reservation_id_idx" ON "contracts" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reservations_farm_id_idx" ON "reservations" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "reservations_year_idx" ON "reservations" USING btree ("year");--> statement-breakpoint
CREATE INDEX "reservations_block_id_idx" ON "reservations" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "reservations_crop_id_idx" ON "reservations" USING btree ("crop_id");--> statement-breakpoint
ALTER TABLE "active_times" ADD CONSTRAINT "active_times_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_greenhouse_id_greenhouses_id_fk" FOREIGN KEY ("greenhouse_id") REFERENCES "public"."greenhouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_sub_block_id_sub_blocks_id_fk" FOREIGN KEY ("sub_block_id") REFERENCES "public"."sub_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_planting_id_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."plantings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_variety_id_crop_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."crop_varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD CONSTRAINT "performance_per_person_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_sub_block_id_sub_blocks_id_fk" FOREIGN KEY ("sub_block_id") REFERENCES "public"."sub_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_active_time_activity_id_active_time_activities_id_fk" FOREIGN KEY ("active_time_activity_id") REFERENCES "public"."active_time_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "active_time_activities_active_time_id_idx" ON "active_time_activities" USING btree ("active_time_id");--> statement-breakpoint
CREATE INDEX "active_time_activities_activity_id_idx" ON "active_time_activities" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "active_times_farm_id_idx" ON "active_times" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "active_times_crop_id_idx" ON "active_times" USING btree ("crop_id");--> statement-breakpoint
CREATE INDEX "active_times_season_id_idx" ON "active_times" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "activities_farm_id_idx" ON "activities" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "audit_logs_farm_id_idx" ON "audit_logs" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_type_idx" ON "audit_logs" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "block_master_farm_id_idx" ON "block_master" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "block_master_field_id_idx" ON "block_master" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "block_master_greenhouse_id_idx" ON "block_master" USING btree ("greenhouse_id");--> statement-breakpoint
CREATE INDEX "blocks_farm_id_idx" ON "blocks" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "blocks_parent_id_idx" ON "blocks" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "crop_data_farm_id_idx" ON "crop_data" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "crop_data_crop_id_idx" ON "crop_data" USING btree ("crop_id");--> statement-breakpoint
CREATE INDEX "crop_data_season_id_idx" ON "crop_data" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "crop_data_status_idx" ON "crop_data" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crop_data_modules_crop_data_id_idx" ON "crop_data_modules" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "germination_test_crop_data_id_idx" ON "germination_test" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "harvest_records_crop_data_id_idx" ON "harvest_records" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "harvest_records_variety_id_idx" ON "harvest_records" USING btree ("variety_id");--> statement-breakpoint
CREATE INDEX "media_attachments_entity_id_idx" ON "media_attachments" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "nursery_crop_data_id_idx" ON "nursery" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "performance_per_person_crop_data_id_idx" ON "performance_per_person" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "performance_per_person_worker_id_idx" ON "performance_per_person" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "pollination_crop_data_id_idx" ON "pollination" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "post_harvest_crop_data_id_idx" ON "post_harvest" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "post_harvest_summary_crop_data_id_idx" ON "post_harvest_summary" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "production_crop_data_id_idx" ON "production" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "program_info_crop_data_id_idx" ON "program_info" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "revenue_crop_data_id_idx" ON "revenue" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "seeds_quality_crop_data_id_idx" ON "seeds_quality" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "sq_breakdown_crop_data_id_idx" ON "sq_breakdown" USING btree ("crop_data_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crop_types_crop_id_id_idx" ON "crop_types" USING btree ("crop_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "crop_varieties_crop_id_id_idx" ON "crop_varieties" USING btree ("crop_id","id");--> statement-breakpoint
CREATE INDEX "events_farm_id_idx" ON "events" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sub_blocks_block_id_idx" ON "sub_blocks" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "seasons_farm_id_idx" ON "seasons" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "seasons_year_idx" ON "seasons" USING btree ("year");--> statement-breakpoint
CREATE INDEX "plantings_farm_id_idx" ON "plantings" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "plantings_crop_id_idx" ON "plantings" USING btree ("crop_id");--> statement-breakpoint
CREATE INDEX "plantings_season_id_idx" ON "plantings" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "plantings_block_master_id_idx" ON "plantings" USING btree ("block_master_id");--> statement-breakpoint
CREATE INDEX "plantings_status_idx" ON "plantings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_farm_id_idx" ON "tasks" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "tasks_crop_id_idx" ON "tasks" USING btree ("crop_id");--> statement-breakpoint
CREATE INDEX "tasks_crop_data_id_idx" ON "tasks" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "tasks_assigned_to_idx" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "previous_value";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN "new_value";--> statement-breakpoint
ALTER TABLE "harvest_records" DROP COLUMN "block";--> statement-breakpoint
ALTER TABLE "harvest_records" DROP COLUMN "variety";--> statement-breakpoint
ALTER TABLE "density_master" DROP COLUMN "spacing_m";--> statement-breakpoint
ALTER TABLE "density_master" DROP COLUMN "row_spacing_m";--> statement-breakpoint
ALTER TABLE "density_master" DROP COLUMN "notes";