-- Phase 6 (contracts, follow-up): dispute lifecycle for contract_orders.
-- Mirrors service_order_disputes — either party can raise, admin resolves
-- via /api/admin/contract-orders/[id]/resolve-dispute, transition stays in
-- transitionContractOrder. Idempotent — safe to replay.

CREATE TABLE IF NOT EXISTS "contract_order_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_order_id" uuid NOT NULL,
	"raised_by" integer NOT NULL,
	"reason" text NOT NULL,
	"resolution" text,
	"resolved_by" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "contract_order_disputes" ADD CONSTRAINT "contract_order_disputes_contract_order_id_fkey"
		FOREIGN KEY ("contract_order_id") REFERENCES "contract_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "contract_order_disputes" ADD CONSTRAINT "contract_order_disputes_raised_by_fkey"
		FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "contract_order_disputes" ADD CONSTRAINT "contract_order_disputes_resolved_by_fkey"
		FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_contract_order_disputes_contract_order"
	ON "contract_order_disputes" ("contract_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_order_disputes_open"
	ON "contract_order_disputes" ("contract_order_id")
	WHERE resolution IS NULL;
