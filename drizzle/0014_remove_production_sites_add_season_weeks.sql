ALTER TABLE "seasons" ADD COLUMN "start_week" integer;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "end_week" integer;--> statement-breakpoint
ALTER TABLE "density_master" DROP COLUMN "production_site_id";--> statement-breakpoint
DROP TABLE IF EXISTS "production_sites";
