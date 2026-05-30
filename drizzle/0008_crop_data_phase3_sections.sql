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
ALTER TABLE "germination_test" ADD CONSTRAINT "germination_test_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeds_quality" ADD CONSTRAINT "seeds_quality_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sq_breakdown" ADD CONSTRAINT "sq_breakdown_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;