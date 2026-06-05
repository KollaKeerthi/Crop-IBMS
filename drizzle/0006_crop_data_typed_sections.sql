CREATE TABLE "revenue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"male_total_weeks" integer,
	"female_total_weeks" integer,
	"male_agreed_unit_price" real,
	"female_agreed_unit_price" real,
	"additional_revenue" real,
	"planned_remarks" text,
	"actual_remarks" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_actual_sowing_date" timestamp;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_actual_sowing_date" timestamp;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_germination_pct" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_germination_pct" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_actual_planting_date" timestamp;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_actual_planting_date" timestamp;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "actual_planting_week" integer;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_actual_plants_planted" integer;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_actual_plants_planted" integer;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_actual_plants_per_row" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_actual_plants_per_row" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_actual_rows_planted" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_actual_rows_planted" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "male_actual_surface_area" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "female_actual_surface_area" real;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "remarks_from_customer" text;--> statement-breakpoint
ALTER TABLE "nursery" ADD COLUMN "recommendations" text;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_batch_no" text;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_batch_no" text;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_planned_sowing_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_planned_sowing_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_planned_planting_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_planned_planting_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_planned_plants" integer;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_planned_plants" integer;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_planned_plants_per_row" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_planned_plants_per_row" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_planned_plants_per_sqm" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_planned_plants_per_sqm" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "planned_surface_area" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "planned_no_of_rows" integer;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "proposed_gram_per_plant" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "agreed_gram_per_plant" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "base_yield_kg" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "grams_per_sqm" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "material_arrival_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "block_prep_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "block_prep_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "production_year" integer;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "male_requested_quantity" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "female_requested_quantity" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "agreed_order_from_customer_kg" real;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "requested_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "archive_status" text;--> statement-breakpoint
ALTER TABLE "program_info" ADD COLUMN "remarks_from_customer" text;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nursery" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "nursery" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "nursery" DROP COLUMN "seedlings_count";--> statement-breakpoint
ALTER TABLE "nursery" DROP COLUMN "germination_rate";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "batch_no";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "planting_date";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "male_plant_count";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "female_plant_count";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "surface_area_sqm";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "male_density";--> statement-breakpoint
ALTER TABLE "program_info" DROP COLUMN "female_density";