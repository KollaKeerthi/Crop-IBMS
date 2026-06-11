CREATE TABLE "stakeholder_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "max_simultaneous" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "crop_varieties" ADD COLUMN "stakeholder_id" uuid;--> statement-breakpoint
ALTER TABLE "density_master" ADD COLUMN "stakeholder_id" uuid;--> statement-breakpoint
ALTER TABLE "stakeholder_master" ADD CONSTRAINT "stakeholder_master_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_varieties" ADD CONSTRAINT "crop_varieties_stakeholder_id_stakeholder_master_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholder_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "density_master" ADD CONSTRAINT "density_master_stakeholder_id_stakeholder_master_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholder_master"("id") ON DELETE set null ON UPDATE no action;