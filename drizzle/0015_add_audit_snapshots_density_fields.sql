ALTER TABLE "audit_logs" ADD COLUMN "previous_value" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "new_value" jsonb;--> statement-breakpoint
ALTER TABLE "density_master" ADD COLUMN "crop_type_id" uuid;--> statement-breakpoint
ALTER TABLE "density_master" ADD COLUMN "production_type_id" uuid;--> statement-breakpoint
ALTER TABLE "density_master" ADD COLUMN "year" integer DEFAULT EXTRACT(YEAR FROM now())::integer NOT NULL;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_production_type_id_production_types_id_fk" FOREIGN KEY ("production_type_id") REFERENCES "public"."production_types"("id") ON DELETE set null ON UPDATE no action;
