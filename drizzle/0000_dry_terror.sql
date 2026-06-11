CREATE TYPE "public"."block_parent_type" AS ENUM('field', 'greenhouse');--> statement-breakpoint
CREATE TYPE "public"."calendar_provider" AS ENUM('google', 'outlook');--> statement-breakpoint
CREATE TYPE "public"."crop_data_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sex_expression" AS ENUM('Male', 'Female', 'Bisexual', 'Gynoecious', 'Monoecious', 'Andromonoecious', 'Semi-gynoecious', '2n', '4n');--> statement-breakpoint
CREATE TYPE "public"."crop_variety_gender" AS ENUM('Male', 'Female');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('none', 'daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."geometry_type" AS ENUM('Point', 'Polygon', 'LineString');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'MANAGER', 'WORKER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('OWNER', 'MANAGER', 'WORKER');--> statement-breakpoint
CREATE TYPE "public"."variability_kind" AS ENUM('Fixed', 'Flexible');--> statement-breakpoint
CREATE TYPE "public"."planting_method" AS ENUM('Direct', 'Transplant', 'Cutting', 'Seed');--> statement-breakpoint
CREATE TYPE "public"."planting_status" AS ENUM('Planned', 'Nursery', 'Planted', 'Growing', 'Harvested', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('Low', 'Medium', 'High', 'Urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('Pending', 'InProgress', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "active_time_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"active_time_id" uuid NOT NULL,
	"activity_id" uuid,
	"week_number" integer,
	"day_offset" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "active_times" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"crop_id" uuid,
	"variety_id" uuid,
	"season_id" uuid,
	"production_type_id" uuid,
	"lead_time_type" text,
	"material_arrival" integer,
	"sowing_male" integer,
	"sowing_female" integer,
	"planting_male" integer,
	"planting_female" integer,
	"pollination_start" integer,
	"pollination_end" integer,
	"harvesting_start" integer,
	"harvesting_end" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"code" text,
	"display_order" integer DEFAULT 0,
	"max_simultaneous" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"resource_type" text,
	"resource" text NOT NULL,
	"resource_name" text,
	"previous_data" jsonb,
	"new_data" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"field_id" uuid,
	"greenhouse_id" uuid,
	"sub_block_id" uuid,
	"block_name" text NOT NULL,
	"sub_block_name" text,
	"area_sqm" real,
	"rows" integer,
	"row_length_m" real,
	"row_width_m" real,
	"suitable_crops" jsonb,
	"index_starts" integer DEFAULT 1,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"parent_type" "block_parent_type" NOT NULL,
	"parent_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area_sqm" real,
	"boundary" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "calendar_provider" NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"event_map" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "crop_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"crop_id" uuid,
	"crop_type_id" uuid,
	"variety_id" uuid,
	"season_id" uuid,
	"planting_id" uuid,
	"block_master_id" uuid,
	"block" text,
	"field_name" text,
	"field_code" text,
	"sex_expression" "sex_expression",
	"contract_no" text,
	"header_no" text,
	"customer_code" text,
	"contract_ref" text,
	"status" "crop_data_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_data_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"module_type" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "germination_test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"sown_date" timestamp,
	"final_count_date" timestamp,
	"sown_on" text,
	"good" integer,
	"small" integer,
	"too_small" integer,
	"abnormal" integer,
	"rotting" integer,
	"no_ger" integer,
	"remarks" text,
	"emp_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harvest_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"variety_id" uuid,
	"block_master_id" uuid,
	"harvest_date" timestamp,
	"code" text,
	"row_m2" real,
	"row_no" integer,
	"emp_name" text,
	"harvest_code" text,
	"kg" real,
	"germination_pct" real,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"url" text NOT NULL,
	"cloudinary_id" text,
	"teedy_document_id" text,
	"teedy_file_id" text,
	"name" text,
	"mime_type" text,
	"size_bytes" integer,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nursery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"male_actual_sowing_date" timestamp,
	"female_actual_sowing_date" timestamp,
	"male_germination_pct" real,
	"female_germination_pct" real,
	"male_actual_planting_date" timestamp,
	"female_actual_planting_date" timestamp,
	"actual_planting_week" integer,
	"male_actual_plants_planted" integer,
	"female_actual_plants_planted" integer,
	"male_actual_plants_per_row" real,
	"female_actual_plants_per_row" real,
	"male_actual_rows_planted" real,
	"female_actual_rows_planted" real,
	"male_actual_surface_area" real,
	"female_actual_surface_area" real,
	"remarks_from_customer" text,
	"recommendations" text,
	"data" jsonb,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_per_person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"worker_id" uuid,
	"activity_id" uuid,
	"date" timestamp,
	"emp_name" text,
	"activity" text,
	"output_qty" real,
	"data" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pollination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"pollination_start" timestamp,
	"pollination_end" timestamp,
	"supervisor" text,
	"avg_seeds_per_fruit" real,
	"fruits_per_plant" real,
	"seeds_per_gram" real,
	"expected_harvest_date" timestamp,
	"avg_temp_during_pollination" real,
	"light_during_pollination" real,
	"avg_humidity_during_pollination" real,
	"remarks" text,
	"recommendations" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_harvest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"harvest_start_date" timestamp,
	"harvest_end_date" timestamp,
	"planned_shipping_date" timestamp,
	"actual_shipping_date" timestamp,
	"total_no_of_harvests" integer,
	"total_kgs" real,
	"net_crop_cycle_weeks" real,
	"germination_pct" real,
	"remarks" text,
	"recommendations" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_harvest_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"date" timestamp,
	"kgs" real,
	"germination_pct" real,
	"remarks" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"realized_plants" integer,
	"realized_rows" integer,
	"realized_surface_area" real,
	"realized_plants_per_sqm" real,
	"avg_temperature" real,
	"avg_radiation" real,
	"avg_humidity" real,
	"remarks" text,
	"recommendations" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"male_batch_no" text,
	"female_batch_no" text,
	"male_planned_sowing_date" timestamp,
	"female_planned_sowing_date" timestamp,
	"male_planned_planting_date" timestamp,
	"female_planned_planting_date" timestamp,
	"male_planned_plants" integer,
	"female_planned_plants" integer,
	"male_planned_plants_per_row" real,
	"female_planned_plants_per_row" real,
	"male_planned_plants_per_sqm" real,
	"female_planned_plants_per_sqm" real,
	"planned_surface_area" real,
	"planned_no_of_rows" integer,
	"proposed_gram_per_plant" real,
	"agreed_gram_per_plant" real,
	"base_yield_kg" real,
	"grams_per_sqm" real,
	"material_arrival_date" timestamp,
	"block_prep_start_date" timestamp,
	"block_prep_end_date" timestamp,
	"production_year" integer,
	"male_requested_quantity" real,
	"female_requested_quantity" real,
	"agreed_order_from_customer_kg" real,
	"requested_delivery_date" timestamp,
	"archive_status" text,
	"remarks_from_customer" text,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "seeds_quality" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"total_seeds_sown" integer,
	"good1" integer,
	"good2" integer,
	"abnormal" integer,
	"too_small" integer,
	"non_germinated" integer,
	"crop_assessment_score" real,
	"kg_customer_after_cleaning" real,
	"remarks" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sq_breakdown" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"germ_good_kg" real,
	"germ_good_pct" real,
	"germ_low_kg" real,
	"germ_low_pct" real,
	"germ_customer_good_kg" real,
	"germ_customer_good_pct" real,
	"germ_customer_low_kg" real,
	"germ_customer_low_pct" real,
	"germ_low_export_date" timestamp,
	"inbred_pct" real,
	"off_type" real,
	"recommendations" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"colour" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_varieties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"gender" "crop_variety_gender",
	"colour_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"scientific_name" text,
	"family" text,
	"description" text,
	"image_url" text,
	"cloudinary_id" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "density_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"crop_id" uuid,
	"crop_type_id" uuid,
	"production_type_id" uuid,
	"year" integer,
	"male_density" real,
	"female_density" real,
	"valid_from" integer DEFAULT 1 NOT NULL,
	"valid_to" integer DEFAULT 52 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"start_time" text,
	"end_time" text,
	"all_day" boolean DEFAULT false NOT NULL,
	"recurrence_type" "recurrence_type" DEFAULT 'none' NOT NULL,
	"recurrence_data" jsonb,
	"google_event_id" text,
	"outlook_event_id" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farm_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"asset_type" text NOT NULL,
	"name" text,
	"geometry_type" geometry_type DEFAULT 'Point' NOT NULL,
	"coordinates" jsonb NOT NULL,
	"properties" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farm_memberships" (
	"user_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'WORKER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "farm_memberships_user_id_farm_id_pk" PRIMARY KEY("user_id","farm_id")
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"address" text,
	"country" text,
	"latitude" real,
	"longitude" real,
	"boundary" jsonb,
	"area_sqm" real,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area_sqm" real,
	"no_of_blocks" integer DEFAULT 0,
	"boundary" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "greenhouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area_sqm" real,
	"boundary" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"role" "user_role" DEFAULT 'OWNER' NOT NULL,
	"primary_farm_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sub_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"name" text NOT NULL,
	"rows" integer,
	"row_length_m" real,
	"row_width_m" real,
	"area_sqm" real,
	"suitable_crops" jsonb,
	"boundary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"start_week" integer,
	"end_week" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "variability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid,
	"production_type_id" uuid NOT NULL,
	"variability" "variability_kind" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"crop_id" uuid,
	"variety_id" uuid,
	"season_id" uuid,
	"block_master_id" uuid,
	"sub_block_id" uuid,
	"location_type" text,
	"status" "planting_status" DEFAULT 'Planned' NOT NULL,
	"planting_method" "planting_method",
	"nursery_start_date" timestamp,
	"field_planting_date" timestamp,
	"first_harvest_date" timestamp,
	"harvest_end_date" timestamp,
	"num_rows" real,
	"spacing_m" real,
	"area_sqm" real,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location_type" text,
	"block_master_id" uuid,
	"crop_id" uuid,
	"crop_data_id" uuid,
	"active_time_activity_id" uuid,
	"associated_to" text,
	"assigned_to" uuid,
	"priority" "task_priority" DEFAULT 'Medium' NOT NULL,
	"status" "task_status" DEFAULT 'Pending' NOT NULL,
	"due_date" timestamp,
	"start_date" timestamp,
	"repeat_rule" text,
	"estimated_hours" real,
	"color" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_template_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"text" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" "task_priority" DEFAULT 'Medium' NOT NULL,
	"estimated_hours" real,
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
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_time_activities" ADD CONSTRAINT "active_time_activities_active_time_id_active_times_id_fk" FOREIGN KEY ("active_time_id") REFERENCES "public"."active_times"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_time_activities" ADD CONSTRAINT "active_time_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_times" ADD CONSTRAINT "active_times_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_times" ADD CONSTRAINT "active_times_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_times" ADD CONSTRAINT "active_times_variety_id_crop_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."crop_varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_times" ADD CONSTRAINT "active_times_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_times" ADD CONSTRAINT "active_times_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_field_id_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_greenhouse_id_greenhouses_id_fk" FOREIGN KEY ("greenhouse_id") REFERENCES "public"."greenhouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_master" ADD CONSTRAINT "block_master_sub_block_id_sub_blocks_id_fk" FOREIGN KEY ("sub_block_id") REFERENCES "public"."sub_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_block_id_block_master_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_active_time_id_active_times_id_fk" FOREIGN KEY ("active_time_id") REFERENCES "public"."active_times"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_variety_id_crop_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."crop_varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_planting_id_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."plantings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_modules" ADD CONSTRAINT "crop_data_modules_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "germination_test" ADD CONSTRAINT "germination_test_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_variety_id_crop_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."crop_varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_attachments" ADD CONSTRAINT "media_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nursery" ADD CONSTRAINT "nursery_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD CONSTRAINT "performance_per_person_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD CONSTRAINT "performance_per_person_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD CONSTRAINT "performance_per_person_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollination" ADD CONSTRAINT "pollination_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_harvest" ADD CONSTRAINT "post_harvest_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_harvest_summary" ADD CONSTRAINT "post_harvest_summary_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production" ADD CONSTRAINT "production_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_info" ADD CONSTRAINT "program_info_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeds_quality" ADD CONSTRAINT "seeds_quality_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sq_breakdown" ADD CONSTRAINT "sq_breakdown_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_types" ADD CONSTRAINT "crop_types_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_varieties" ADD CONSTRAINT "crop_varieties_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_assets" ADD CONSTRAINT "farm_assets_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_memberships" ADD CONSTRAINT "farm_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_memberships" ADD CONSTRAINT "farm_memberships_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greenhouses" ADD CONSTRAINT "greenhouses_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_blocks" ADD CONSTRAINT "sub_blocks_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variability" ADD CONSTRAINT "variability_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variability" ADD CONSTRAINT "variability_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_variety_id_crop_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."crop_varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_sub_block_id_sub_blocks_id_fk" FOREIGN KEY ("sub_block_id") REFERENCES "public"."sub_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_active_time_activity_id_active_time_activities_id_fk" FOREIGN KEY ("active_time_activity_id") REFERENCES "public"."active_time_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_template_checklist_items" ADD CONSTRAINT "task_template_checklist_items_template_id_task_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_block_id_block_master_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_active_time_id_active_times_id_fk" FOREIGN KEY ("active_time_id") REFERENCES "public"."active_times"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "contracts_farm_id_idx" ON "contracts" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "contracts_year_idx" ON "contracts" USING btree ("year");--> statement-breakpoint
CREATE INDEX "contracts_block_id_idx" ON "contracts" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "contracts_reservation_id_idx" ON "contracts" USING btree ("reservation_id");--> statement-breakpoint
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
CREATE INDEX "reservations_farm_id_idx" ON "reservations" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "reservations_year_idx" ON "reservations" USING btree ("year");--> statement-breakpoint
CREATE INDEX "reservations_block_id_idx" ON "reservations" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "reservations_crop_id_idx" ON "reservations" USING btree ("crop_id");