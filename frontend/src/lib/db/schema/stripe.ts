import { pgTable, integer, text, boolean, timestamp, jsonb, foreignKey, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export const stripeConnectAccounts = pgTable("stripe_connect_accounts", {
  userId: integer("user_id").primaryKey().notNull(),
  accountId: text("account_id").notNull(),
  chargesEnabled: boolean("charges_enabled").default(false).notNull(),
  payoutsEnabled: boolean("payouts_enabled").default(false).notNull(),
  detailsSubmitted: boolean("details_submitted").default(false).notNull(),
  requirementsCurrentlyDue: jsonb("requirements_currently_due").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "stripe_connect_accounts_user_id_fkey",
  }).onDelete("cascade"),
  unique("stripe_connect_accounts_account_id_key").on(table.accountId),
]);

// Webhook dedupe table. PK is the Stripe event ID (e.g. "evt_..."); webhook
// handlers insert with ON CONFLICT (id) DO NOTHING and skip processing if a
// row already exists.
export const stripeEvents = pgTable("stripe_events", {
  id: text().primaryKey().notNull(),
  type: text().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  payload: jsonb().notNull(),
});
