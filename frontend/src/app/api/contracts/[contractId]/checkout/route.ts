import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { contractOrders } from '@/lib/db/schema/contracts';
import { fetchFullContract, getConversationParticipants } from '@/lib/contracts';
import { assertConnectReady } from '@/lib/connect';
import { PLATFORM_FEE_PCT } from '@/lib/config/fees';

/**
 * POST /api/contracts/[contractId]/checkout — Stripe Embedded Checkout
 * session for a fully-signed contract.
 *
 * Mirrors src/app/api/service-orders/checkout/route.ts: no transfer_data,
 * no application_fee_amount — funds land on the platform balance first.
 * The contract_orders row is created from the webhook, not here.
 *
 * Gated on:
 *   - caller is the contract's client (the job poster).
 *   - contract.status === 'accepted'.
 *   - no contract_orders row exists yet (mirrors the contract_id UNIQUE).
 *   - the freelancer's Connect account is charges_enabled + payouts_enabled.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  const contract = await fetchFullContract(contractId);
  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  const participants = await getConversationParticipants(contract.conversationId);
  if (!participants) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  const { clientId, freelancerId } = participants;

  if (session.user.id !== clientId) {
    return NextResponse.json(
      { error: 'Only the client can pay for this contract' },
      { status: 403 },
    );
  }

  if (contract.status !== 'accepted') {
    return NextResponse.json(
      { error: 'Contract must be fully signed before payment' },
      { status: 409 },
    );
  }

  const rev = contract.currentRevision;
  if (!rev) {
    return NextResponse.json({ error: 'Contract has no current revision' }, { status: 409 });
  }

  const existing = await db
    .select({ id: contractOrders.id, state: contractOrders.state })
    .from(contractOrders)
    .where(eq(contractOrders.contractId, contractId))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'This contract has already been paid' },
      { status: 409 },
    );
  }

  // Live-sync against Stripe — a stale cached `charges_enabled=true` after
  // capability loss would let us collect money we can't pay out.
  const readiness = await assertConnectReady(freelancerId);
  if (!readiness.ok) {
    return NextResponse.json(
      { error: 'Freelancer is not yet able to receive payments' },
      { status: 409 },
    );
  }

  // contract_revisions.price is `numeric` → string like "1500.00".
  // Stripe needs minor units as an integer.
  const major = Number(rev.price);
  if (!Number.isFinite(major) || major <= 0) {
    return NextResponse.json({ error: 'Invalid contract price' }, { status: 422 });
  }
  const unitAmount = Math.round(major * 100);
  const currency = rev.currency.toLowerCase();

  const origin = _req.nextUrl.origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: rev.title.slice(0, 250),
            description: rev.scope.slice(0, 200),
            metadata: { kind: 'contract', contract_id: contractId },
          },
        },
      },
    ],
    payment_intent_data: {
      metadata: {
        contract_id: contractId,
        client_id: String(clientId),
      },
    },
    metadata: {
      kind: 'contract',
      contract_id: contractId,
      client_id: String(clientId),
      freelancer_id: String(freelancerId),
      currency,
      platform_fee_pct: PLATFORM_FEE_PCT.toFixed(2),
    },
    return_url: `${origin}/contracts/${contractId}/pay/return?session_id={CHECKOUT_SESSION_ID}`,
  });

  return NextResponse.json({ clientSecret: checkoutSession.client_secret });
}
