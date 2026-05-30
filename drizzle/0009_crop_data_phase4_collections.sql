CREATE TABLE "harvest_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"harvest_date" timestamp,
	"block" text,
	"variety" text,
	"code" text,
	"row_m2" real,
	"row_no" integer,
	"emp_name" text,
	"harvest_code" text,
	"kg" real,
	"germination_pct" real,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD COLUMN "emp_name" text;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD COLUMN "activity" text;--> statement-breakpoint
ALTER TABLE "performance_per_person" ADD COLUMN "output_qty" real;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;