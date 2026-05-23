import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { stripeEvents } from '@/lib/db/schema/stripe';
import {
  handleAccountUpdated,
  handleChargeRefunded,
  handleCheckoutCompleted,
  handleTransferEvent,
} from '@/lib/webhooks/stripe';

/**
 * POST /api/webhooks/stripe — Stripe webhook entry point.
 *
 * - Reads the raw body for signature verification.
 * - Verifies via STRIPE_WEBHOOK_SECRET; 400 on bad signature.
 * - Dedupes via the stripe_events table (PK is the event id).
 * - Dispatches to handlers in src/lib/webhooks/stripe.ts.
 *
 * Handlers must be idempotent because the dedupe row is inserted BEFORE
 * the handler runs — if the handler crashes mid-way, the next replay
 * will be marked duplicate and skip. (We accept that risk for MVP;
 * upgrade to processed_at-flag if it bites.)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET not configured' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  const inserted = await db
    .insert(stripeEvents)
    .values({
      id: event.id,
      type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: stripeEvents.id })
    .returning({ id: stripeEvents.id });

  if (inserted.length === 0) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event);
      break;
    case 'account.updated':
      await handleAccountUpdated(event);
      break;
    case 'transfer.created':
    case 'transfer.updated':
      // Stripe's "transfer.paid" event has been folded into transfer.updated
      // in newer API versions; we handle both shapes via the same path.
      await handleTransferEvent(event);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event);
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
