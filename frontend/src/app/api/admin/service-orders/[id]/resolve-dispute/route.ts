import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  serviceOrderDisputes,
  serviceOrders,
} from '@/lib/db/schema/services';
import { InvalidTransitionError, transitionServiceOrder } from '@/lib/orders';
import {
  TransferError,
  computeOrderPayout,
  createSplitTransferForOrder,
  createTransferForOrder,
} from '@/lib/transfers';
import { RefundError, refundFullOrder, refundPartialOrder } from '@/lib/refunds';
import { notifyOrderDisputeResolved } from '@/lib/email/notifications';

const ResolveSchema = z.discriminatedUnion('resolution', [
  z.object({ resolution: z.literal('refund_client') }),
  z.object({ resolution: z.literal('pay_freelancer') }),
  z.object({
    resolution: z.literal('split'),
    refundAmount: z.number().int().positive(),
  }),
]);

/**
 * POST /api/admin/service-orders/:id/resolve-dispute — admin-only.
 *
 * Body discriminator on `resolution`:
 *   - 'refund_client'  → refund every PI in full; disputed → refunded.
 *   - 'pay_freelancer' → create transfer (net of platform fee); disputed → completed.
 *   - 'split' + refundAmount → partial refund + transfer of (gross - refundAmount)
 *     to freelancer with NO platform fee deduction; disputed → completed.
 *
 * Stripe API calls happen before the DB state transition so a failed
 * Stripe call leaves the order in 'disputed' and the dispute open —
 * admin can retry. Stripe idempotency keys make retries safe.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const orders = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.id, id))
    .limit(1);
  if (orders.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const order = orders[0];
  if (order.state !== 'disputed') {
    return NextResponse.json(
      { error: `Order in state '${order.state}' is not under dispute` },
      { status: 409 },
    );
  }

  const openDispute = await db
    .select({ id: serviceOrderDisputes.id })
    .from(serviceOrderDisputes)
    .where(
      and(
        eq(serviceOrderDisputes.orderId, id),
        isNull(serviceOrderDisputes.resolution),
      ),
    )
    .orderBy(serviceOrderDisputes.createdAt)
    .limit(1);
  if (openDispute.length === 0) {
    return NextResponse.json(
      { error: 'No open dispute on this order' },
      { status: 409 },
    );
  }
  const disputeId = openDispute[0].id;

  try {
    if (parsed.data.resolution === 'refund_client') {
      await refundFullOrder(order);
      await finalizeDispute(disputeId, 'refund_client', session.user.id, order.id, 'disputed', 'refunded');
    } else if (parsed.data.resolution === 'pay_freelancer') {
      await createTransferForOrder(order);
      await finalizeDispute(disputeId, 'pay_freelancer', session.user.id, order.id, 'disputed', 'completed');
    } else {
      const { gross } = await computeOrderPayout(order);
      if (parsed.data.refundAmount >= gross) {
        return NextResponse.json(
          { error: `refundAmount (${parsed.data.refundAmount}) must be less than order gross (${gross})` },
          { status: 400 },
        );
      }
      const transferAmount = gross - parsed.data.refundAmount;
      await refundPartialOrder(order, parsed.data.refundAmount);
      await createSplitTransferForOrder(order, transferAmount);
      await finalizeDispute(disputeId, 'split', session.user.id, order.id, 'disputed', 'completed');
    }
  } catch (err) {
    if (err instanceof RefundError || err instanceof TransferError) {
      console.error(`[resolve-dispute] Stripe side-effect failed for order ${id}:`, err);
      return NextResponse.json(
        { error: err.message, code: err.name === 'RefundError' ? 'refund_failed' : 'transfer_failed' },
        { status: 502 },
      );
    }
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: 'Order state changed before resolution could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }

  await notifyOrderDisputeResolved(id, parsed.data.resolution);

  return NextResponse.json({ ok: true });
}

async function finalizeDispute(
  disputeId: string,
  resolution: 'refund_client' | 'pay_freelancer' | 'split',
  resolvedBy: number,
  orderId: string,
  fromState: string,
  toState: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(serviceOrderDisputes)
      .set({
        resolution,
        resolvedBy,
        resolvedAt: sql`now()`,
      })
      .where(eq(serviceOrderDisputes.id, disputeId));

    await transitionServiceOrder(orderId, fromState, toState, {}, tx);
  });
}
