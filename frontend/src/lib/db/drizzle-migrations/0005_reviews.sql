-- Phase: reviews on service orders (and contracts later).
-- All statements wrapped in idempotent guards so this is safe to replay.
-- See MIGRATION.md "Reconciliation drift" for the rationale.

CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid,
	"service_order_id" uuid,
	"reviewer_id" integer NOT NULL,
	"reviewee_id" integer NOT NULL,
	"reviewer_role" text NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "reviews_reviewer_role_check" CHECK ("reviewer_role" IN ('client', 'freelancer')),
	CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
	CONSTRAINT "reviews_status_check" CHECK ("status" IN ('pending', 'published')),
	CONSTRAINT "reviews_one_subject" CHECK (("contract_id" IS NOT NULL) <> ("service_order_id" IS NOT NULL))
);
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_contract_reviewer_uidx" ON "reviews" USING btree ("contract_id","reviewer_id") WHERE "contract_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_order_reviewer_uidx" ON "reviews" USING btree ("service_order_id","reviewer_id") WHERE "service_order_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewee_status_idx" ON "reviews" USING btree ("reviewee_id","status");
