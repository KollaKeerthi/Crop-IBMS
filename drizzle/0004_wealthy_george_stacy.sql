ALTER TABLE "crop_types" ADD COLUMN "colour" text;--> statement-breakpoint
ALTER TABLE "crop_types" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "crop_varieties" ADD COLUMN "colour_description" text;--> statement-breakpoint
ALTER TABLE "crop_varieties" DROP COLUMN "code";