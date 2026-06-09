ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "start_week" integer;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "end_week" integer;--> statement-breakpoint
ALTER TABLE "density_master" DROP COLUMN IF EXISTS "production_site_id";--> statement-breakpoint
DROP TABLE IF EXISTS "production_sites";
