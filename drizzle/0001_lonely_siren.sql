CREATE TYPE "public"."variability_kind" AS ENUM('Fixed', 'Flexible');--> statement-breakpoint
CREATE TABLE "variability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid,
	"production_type_id" uuid NOT NULL,
	"variability" "variability_kind" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "variability" ADD CONSTRAINT "variability_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variability" ADD CONSTRAINT "variability_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE cascade ON UPDATE no action;