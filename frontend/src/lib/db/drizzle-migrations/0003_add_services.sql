-- Phase 1: services + add-ons + stripe_events.
-- All statements wrapped in idempotent guards so this is safe to replay.
-- See MIGRATION.md "Reconciliation drift" for the rationale.

CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"freelancer_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"base_price" integer NOT NULL,
	"currency" text DEFAULT 'gbp' NOT NULL,
	"delivery_days" integer NOT NULL,
	"base_revisions" integer DEFAULT 0 NOT NULL,
	"cover_image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"max_quantity" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"client_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"base_price" integer NOT NULL,
	"currency" text DEFAULT 'gbp' NOT NULL,
	"platform_fee_pct" numeric(5, 2) NOT NULL,
	"delivery_deadline" timestamp with time zone NOT NULL,
	"auto_accept_deadline" timestamp with time zone,
	"revisions_purchased" integer NOT NULL,
	"revisions_used" integer DEFAULT 0 NOT NULL,
	"state" text NOT NULL,
	"payment_intent_id" text NOT NULL,
	"transfer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_order_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"addon_id" uuid,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"payment_intent_id" text NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_order_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"freelancer_id" integer NOT NULL,
	"message" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_order_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"client_id" integer NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_order_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"raised_by" integer NOT NULL,
	"reason" text NOT NULL,
	"resolution" text,
	"resolved_by" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "services" ADD CONSTRAINT "services_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_addons" ADD CONSTRAINT "service_addons_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_addons" ADD CONSTRAINT "service_order_addons_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_addons" ADD CONSTRAINT "service_order_addons_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."service_addons"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_deliveries" ADD CONSTRAINT "service_order_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_deliveries" ADD CONSTRAINT "service_order_deliveries_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_revisions" ADD CONSTRAINT "service_order_revisions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_revisions" ADD CONSTRAINT "service_order_revisions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_disputes" ADD CONSTRAINT "service_order_disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_disputes" ADD CONSTRAINT "service_order_disputes_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "service_order_disputes" ADD CONSTRAINT "service_order_disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_services_freelancer_status" ON "services" USING btree ("freelancer_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_orders_freelancer" ON "service_orders" USING btree ("freelancer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_orders_client" ON "service_orders" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_orders_state" ON "service_orders" USING btree ("state");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_orders_auto_accept_due" ON "service_orders" USING btree ("auto_accept_deadline") WHERE state = 'delivered';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_order_addons_order" ON "service_order_addons" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_order_deliveries_order" ON "service_order_deliveries" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_service_order_revisions_order" ON "service_order_revisions" USING btree ("order_id");
