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
ALTER TABLE "pollination" ADD CONSTRAINT "pollination_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_harvest" ADD CONSTRAINT "post_harvest_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_harvest_summary" ADD CONSTRAINT "post_harvest_summary_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production" ADD CONSTRAINT "production_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;