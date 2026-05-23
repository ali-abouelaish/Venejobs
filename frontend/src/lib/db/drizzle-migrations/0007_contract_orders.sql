-- Phase 5 (contracts): one-off payment for a fully-signed contract.
-- Mirrors service_orders shape — payment lands on the platform balance,
-- transfer to the freelancer happens later. Wrapped in idempotent guards
-- so the migration is safe to replay.

CREATE TABLE IF NOT EXISTS "contract_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"client_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"platform_fee_pct" numeric(5, 2) NOT NULL,
	"state" text NOT NULL,
	"payment_intent_id" text NOT NULL,
	"transfer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_orders_contract_id_key" UNIQUE("contract_id"),
	CONSTRAINT "contract_orders_payment_intent_id_key" UNIQUE("payment_intent_id")
);
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "contract_orders" ADD CONSTRAINT "contract_orders_contract_id_fkey"
		FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "contract_orders" ADD CONSTRAINT "contract_orders_client_id_fkey"
		FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "contract_orders" ADD CONSTRAINT "contract_orders_freelancer_id_fkey"
		FOREIGN KEY ("freelancer_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_contract_orders_client" ON "contract_orders" ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_orders_freelancer" ON "contract_orders" ("freelancer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_orders_state" ON "contract_orders" ("state");
