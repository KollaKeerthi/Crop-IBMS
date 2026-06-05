-- production_sites: rename name → code, add description
ALTER TABLE "production_sites" DROP CONSTRAINT "production_sites_name_unique";--> statement-breakpoint
ALTER TABLE "production_sites" RENAME COLUMN "name" TO "code";--> statement-breakpoint
ALTER TABLE "production_sites" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "production_sites" ADD CONSTRAINT "production_sites_code_unique" UNIQUE("code");--> statement-breakpoint

-- production_types: rename name → code, add description
ALTER TABLE "production_types" DROP CONSTRAINT "production_types_name_unique";--> statement-breakpoint
ALTER TABLE "production_types" RENAME COLUMN "name" TO "code";--> statement-breakpoint
ALTER TABLE "production_types" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "production_types" ADD CONSTRAINT "production_types_code_unique" UNIQUE("code");--> statement-breakpoint

-- crop_data: 4 new nullable columns (purely additive)
ALTER TABLE "crop_data" ADD COLUMN "field_code" text;--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "header_no" text;--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "customer_code" text;--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "contract_ref" text;--> statement-breakpoint

-- density_master: validity week range (defaults backfill existing rows)
ALTER TABLE "density_master" ADD COLUMN "valid_from" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "density_master" ADD COLUMN "valid_to" integer DEFAULT 52 NOT NULL;
