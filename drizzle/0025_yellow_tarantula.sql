CREATE TABLE "crop_data_allocation_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_data_id" uuid NOT NULL,
	"contract_line_id" uuid,
	"block_master_id" uuid,
	"crop_id" uuid,
	"variety_id" uuid,
	"row_no" integer NOT NULL,
	"gender" text NOT NULL,
	"plant_count" integer NOT NULL,
	"start_plant_no" integer NOT NULL,
	"end_plant_no" integer NOT NULL,
	"sequence" integer NOT NULL,
	"period_year" integer,
	"period_start_week" integer,
	"period_end_week" integer,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_crop_data_id_crop_data_id_fk" FOREIGN KEY ("crop_data_id") REFERENCES "public"."crop_data"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_contract_line_id_contracts_id_fk" FOREIGN KEY ("contract_line_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_block_master_id_block_master_id_fk" FOREIGN KEY ("block_master_id") REFERENCES "public"."block_master"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_variety_id_crop_varieties_id_fk" FOREIGN KEY ("variety_id") REFERENCES "public"."crop_varieties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_data_allocation_segments" ADD CONSTRAINT "crop_data_allocation_segments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crop_data_alloc_segments_crop_data_id_idx" ON "crop_data_allocation_segments" USING btree ("crop_data_id");--> statement-breakpoint
CREATE INDEX "crop_data_alloc_segments_contract_line_id_idx" ON "crop_data_allocation_segments" USING btree ("contract_line_id");--> statement-breakpoint
CREATE INDEX "crop_data_alloc_segments_block_row_idx" ON "crop_data_allocation_segments" USING btree ("block_master_id","row_no");