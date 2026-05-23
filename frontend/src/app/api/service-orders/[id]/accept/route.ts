import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceOrderAccess } from '@/lib/assertions';
import { InvalidTransitionError, transitionServiceOrder } from '@/lib/orders';
import { TransferError, createTransferForOrder } from '@/lib/transfers';
import { notifyOrderAccepted } from '@/lib/email/notifications';

/**
 * POST /api/service-orders/:id/accept — client accepts the delivered work.
 *
 * 1. Transitions delivered → accepted (sets accepted_at = now()).
 * 2. Creates a Stripe Transfer for the net payout to the freelancer's
 *    Connect account; persists transfer_id on the order.
 * 3. State moves to 'completed' later via the transfer.* webhook.
 *
 * The Stripe call uses an idempotency key keyed by order_id, so a
 * retried accept (e.g. after a transient network error between
 * transition and transfer) returns the same transfer rather than
 * creating a duplicate.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  const order = await assertServiceOrderAccess(id, session.user.id, 'client');
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.state !== 'delivered') {
    return NextResponse.json(
      { error: `Order in state '${order.state}' cannot be accepted` },
      { status: 409 },
    );
  }

  let accepted;
  try {
    accepted = await transitionServiceOrder(order.id, 'delivered', 'accepted', {
      acceptedAt: sql`now()`,
    });
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: 'Order state changed before acceptance could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }

  try {
    const transferId = await createTransferForOrder(accepted);
    await notifyOrderAccepted(order.id, { auto: false });
    return NextResponse.json({ ...accepted, transferId });
  } catch (err) {
    if (err instanceof TransferError) {
      // The order is in 'accepted' state with no transfer_id. Operations
      // can retry the transfer via the cron or a manual replay since the
      // Stripe idempotency key is derived from the order id.
      console.error(`[accept] transfer failed for order ${order.id}:`, err);
      return NextResponse.json(
        {
          error: 'Acceptance recorded but transfer creation failed',
          code: 'transfer_failed',
          message: err.message,
        },
        { status: 502 },
      );
    }
    throw err;
  }
}
