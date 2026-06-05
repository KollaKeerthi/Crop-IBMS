CREATE TYPE "public"."crop_variety_gender" AS ENUM('Male', 'Female');--> statement-breakpoint
ALTER TABLE "crop_varieties" ADD COLUMN "gender" "crop_variety_gender";