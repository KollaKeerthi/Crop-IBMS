CREATE TABLE "crop_data_plants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"planting_row_id" text NOT NULL,
	"row_no" integer NOT NULL,
	"plant_no" integer NOT NULL,
	"plant_code" text NOT NULL,
	"type" text,
	"planted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "location_block_id" uuid;--> statement-breakpoint
ALTER TABLE "crop_data_plants" ADD CONSTRAINT "crop_data_plants_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crop_data_plants_crop_data_id_idx" ON "crop_data_plants" USING btree ("crop_data_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crop_data_plants_row_plant_unique" ON "crop_data_plants" USING btree ("crop_data_id","planting_row_id","plant_no");--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_location_block_id_blocks_id_fk" FOREIGN KEY ("location_block_id") REFERENCES "public"."blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crop_data_location_block_id_idx" ON "crop_data" USING btree ("location_block_id");