CREATE TABLE "stripe_connect_accounts" (
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
ALTER TABLE "stripe_connect_accounts" ADD CONSTRAINT "stripe_connect_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
