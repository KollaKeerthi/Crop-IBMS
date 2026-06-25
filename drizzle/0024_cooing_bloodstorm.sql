ALTER TABLE "block_master" ADD COLUMN "planting_order" text DEFAULT 'left-right' NOT NULL;--> statement-breakpoint
ALTER TABLE "block_master" ADD COLUMN "next_row_order" text DEFAULT 'top-bottom' NOT NULL;--> statement-breakpoint
ALTER TABLE "crop_data" ADD COLUMN "contract_id" uuid;--> statement-breakpoint
ALTER TABLE "crop_data" ADD CONSTRAINT "crop_data_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crop_data_contract_id_idx" ON "crop_data" USING btree ("contract_id");