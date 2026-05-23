-- Phase 2: rejection metadata on services.
-- Wrapped in idempotent guards so this is safe to replay.

ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp with time zone;
