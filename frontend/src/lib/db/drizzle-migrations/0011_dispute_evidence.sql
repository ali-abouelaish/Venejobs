ALTER TABLE "service_order_disputes" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "contract_order_disputes" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;
