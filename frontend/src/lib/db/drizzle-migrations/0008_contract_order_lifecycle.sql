-- Phase 6 (contracts): give contract_orders the delivered → accepted →
-- completed lifecycle that service_orders already has, so funds paid into
-- a signed contract actually flow out to the freelancer instead of sitting
-- on the platform balance.
--
-- Adds the deliver / auto-accept / accept timestamps and a partial index
-- mirroring idx_service_orders_auto_accept_due. Idempotent — safe to
-- replay.

ALTER TABLE "contract_orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "contract_orders" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "contract_orders" ADD COLUMN IF NOT EXISTS "auto_accept_deadline" timestamp with time zone;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_contract_orders_auto_accept_due"
  ON "contract_orders" ("auto_accept_deadline")
  WHERE state = 'delivered';
