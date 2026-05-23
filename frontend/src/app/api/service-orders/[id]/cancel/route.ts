import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceOrderAccess } from '@/lib/assertions';
import { InvalidTransitionError, transitionServiceOrder } from '@/lib/orders';
import { RefundError, refundFullOrder } from '@/lib/refunds';
import { notifyOrderCancelled } from '@/lib/email/notifications';

const CANCELLABLE_FROM = new Set(['paid', 'in_progress']);

/**
 * POST /api/service-orders/:id/cancel — client-self-serve cancellation.
 *
 * MVP rule: state ∈ {paid, in_progress} AND now() > delivery_deadline.
 * Mutual ("freelancer agrees") cancellation flow is not implemented;
 * returns 409 with code='cannot_cancel_yet' before the deadline.
 *
 * On success: refunds every PaymentIntent (base + mid-order addons)
 * with stable idempotency keys, then transitions to 'cancelled'. The
 * order moves to 'refunded' once charge.refunded fires.
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
  if (!CANCELLABLE_FROM.has(order.state)) {
    return NextResponse.json(
      { error: `Order in state '${order.state}' cannot be cancelled` },
      { status: 409 },
    );
  }

  const now = Date.now();
  const deadline = new Date(order.deliveryDeadline).getTime();
  if (now <= deadline) {
    return NextResponse.json(
      {
        error: 'Delivery deadline has not yet passed; cannot self-serve cancel',
        code: 'cannot_cancel_yet',
        deliveryDeadline: order.deliveryDeadline,
      },
      { status: 409 },
    );
  }

  try {
    await refundFullOrder(order);
  } catch (err) {
    if (err instanceof RefundError) {
      console.error(`[cancel] refund failed for order ${order.id}:`, err);
      return NextResponse.json(
        { error: 'Refund creation failed', message: err.message },
        { status: 502 },
      );
    }
    throw err;
  }

  try {
    const updated = await transitionServiceOrder(order.id, order.state, 'cancelled', {
      cancelledAt: sql`now()`,
    });
    await notifyOrderCancelled(order.id);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      // Refund was created with an idempotency key — replays return the
      // same Stripe Refund object. The order's state changed underneath
      // us; surface 409 and let the caller resolve.
      return NextResponse.json(
        { error: 'Order state changed before cancellation could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }
}
