import { eq, sql } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { stripeConnectAccounts } from '@/lib/db/schema/stripe';

export interface ConnectAccountRow {
  userId: number;
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsCurrentlyDue: string[];
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function getConnectAccount(userId: number): Promise<ConnectAccountRow | null> {
  const rows = await db
    .select()
    .from(stripeConnectAccounts)
    .where(eq(stripeConnectAccounts.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Returns the freelancer's Connect account row, creating one on Stripe and
 * persisting it on first call. Uses a Stripe idempotency key derived from
 * the user id so concurrent first-creates return the same Stripe account.
 */
export async function getOrCreateConnectAccount(userId: number): Promise<ConnectAccountRow> {
  const existing = await getConnectAccount(userId);
  if (existing) return existing;

  const account = await stripe.accounts.create(
    {
      type: 'express',
      country: 'GB',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { user_id: String(userId) },
    },
    { idempotencyKey: `user:${userId}:connect-account` },
  );

  const currentlyDue = account.requirements?.currently_due ?? [];

  const [row] = await db
    .insert(stripeConnectAccounts)
    .values({
      userId,
      accountId: account.id,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      requirementsCurrentlyDue: currentlyDue,
    })
    .onConflictDoUpdate({
      target: stripeConnectAccounts.userId,
      set: {
        accountId: account.id,
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
        detailsSubmitted: account.details_submitted ?? false,
        requirementsCurrentlyDue: currentlyDue,
        lastSyncedAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return row;
}

/**
 * Fetches the live state from Stripe and writes it back to the cached row.
 * Returns null if the user has no Connect account yet.
 */
export async function syncConnectAccount(userId: number): Promise<ConnectAccountRow | null> {
  const existing = await getConnectAccount(userId);
  if (!existing) return null;

  const fresh = await stripe.accounts.retrieve(existing.accountId);
  const currentlyDue = fresh.requirements?.currently_due ?? [];

  const [row] = await db
    .update(stripeConnectAccounts)
    .set({
      chargesEnabled: fresh.charges_enabled ?? false,
      payoutsEnabled: fresh.payouts_enabled ?? false,
      detailsSubmitted: fresh.details_submitted ?? false,
      requirementsCurrentlyDue: currentlyDue,
      lastSyncedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(stripeConnectAccounts.userId, userId))
    .returning();
  return row;
}

export type ConnectReadiness =
  | { ok: true; account: ConnectAccountRow }
  | { ok: false; reason: 'no_account' }
  | { ok: false; reason: 'not_ready'; account: ConnectAccountRow };

/**
 * Live-checks readiness via Stripe (do NOT trust a stale cached flag).
 * Use to gate any operation that requires the freelancer to be payable.
 */
export async function assertConnectReady(userId: number): Promise<ConnectReadiness> {
  const synced = await syncConnectAccount(userId);
  if (!synced) return { ok: false, reason: 'no_account' };
  if (!synced.chargesEnabled || !synced.payoutsEnabled) {
    return { ok: false, reason: 'not_ready', account: synced };
  }
  return { ok: true, account: synced };
}
