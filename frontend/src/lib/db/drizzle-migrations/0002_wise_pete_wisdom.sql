-- contract_status enum
DO $$ BEGIN
    CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending_review', 'revision_requested', 'accepted', 'declined', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- enum_jobs_status: add 'filled' if not present
ALTER TYPE "public"."enum_jobs_status" ADD VALUE IF NOT EXISTS 'filled' BEFORE 'closed';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "contract_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"proposed_by" integer NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"scope" text NOT NULL,
	"deliverables" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"deadline" date NOT NULL,
	"payment_terms" text NOT NULL,
	"additional_terms" text,
	"change_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "contract_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"typed_name" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "contract_signatures_contract_id_user_id_key" UNIQUE("contract_id","user_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"created_by" integer NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"current_revision_id" uuid,
	"message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Already created in 0001, guarded for safety
CREATE TABLE IF NOT EXISTS "stripe_connect_accounts" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"charges_enabled" boolean DEFAULT false NOT NULL,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"details_submitted" boolean DEFAULT false NOT NULL,
	"requirements_currently_due" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_connect_accounts_account_id_key" UNIQUE("account_id")
);
--> statement-breakpoint

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hire_count" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "message_type" text DEFAULT 'text' NOT NULL;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "client_id" integer;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "freelancer_id" integer;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "contract_revisions" ADD CONSTRAINT "contract_revisions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "contracts" ADD CONSTRAINT "fk_current_revision" FOREIGN KEY ("current_revision_id") REFERENCES "public"."contract_revisions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "stripe_connect_accounts" ADD CONSTRAINT "stripe_connect_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_contract_revisions_contract" ON "contract_revisions" USING btree ("contract_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_signatures_contract" ON "contract_signatures" USING btree ("contract_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contracts_conversation" ON "contracts" USING btree ("conversation_id" uuid_ops);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_conversations_direct" ON "conversations" USING btree ("client_id" int4_ops,"freelancer_id" int4_ops) WHERE (proposal_id IS NULL);
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hire_count_check" CHECK ((hire_count >= 1) AND (hire_count <= 10));
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- DESTRUCTIVE: drop read_at from messages.
-- Verify nothing references it and there's no data to preserve before applying.
-- If you need to keep the column, comment out the next line.
ALTER TABLE "messages" DROP COLUMN IF EXISTS "read_at";