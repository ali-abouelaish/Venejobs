import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  contractOrderDisputes,
  contractOrders,
} from '@/lib/db/schema/contracts';
import {
  InvalidContractTransitionError,
  transitionContractOrder,
} from '@/lib/orders';
import {
  TransferError,
  createSplitTransferForContractOrder,
  createTransferForContractOrder,
} from '@/lib/transfers';
import {
  RefundError,
  refundContractOrder,
  refundPartialContractOrder,
} from '@/lib/refunds';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';
import { notifyContractDisputeResolved } from '@/lib/email/notifications';

const ResolveSchema = z.discriminatedUnion('resolution', [
  z.object({ resolution: z.literal('refund_client') }),
  z.object({ resolution: z.literal('pay_freelancer') }),
  z.object({
    resolution: z.literal('split'),
    refundAmount: z.number().int().positive(),
  }),
]);

/**
 * POST /api/admin/contract-orders/:id/resolve-dispute — admin-only.
 *
 * Body discriminator on `resolution`:
 *   - 'refund_client'  → refund the PI in full; disputed → refunded.
 *   - 'pay_freelancer' → create transfer (net of platform fee); disputed → completed.
 *   - 'split' + refundAmount → partial refund + transfer of (amount - refundAmount)
 *     to freelancer with NO platform fee deduction; disputed → completed.
 *
 * Mirrors the service-order resolver. Stripe calls happen before the DB
 * transition so a Stripe failure leaves the order in 'disputed' for retry.
 * Stripe idempotency keys make retries safe.
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
    return NextResponse.json({ error: 'Invalid contract order id' }, { status: 400 });
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
    .from(contractOrders)
    .where(eq(contractOrders.id, id))
    .limit(1);
  if (orders.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const order = orders[0];
  if (order.state !== 'disputed') {
    return NextResponse.json(
      { error: `Contract order in state '${order.state}' is not under dispute` },
      { status: 409 },
    );
  }

  const openDispute = await db
    .select({ id: contractOrderDisputes.id })
    .from(contractOrderDisputes)
    .where(
      and(
        eq(contractOrderDisputes.contractOrderId, id),
        isNull(contractOrderDisputes.resolution),
      ),
    )
    .orderBy(contractOrderDisputes.createdAt)
    .limit(1);
  if (openDispute.length === 0) {
    return NextResponse.json(
      { error: 'No open dispute on this contract order' },
      { status: 409 },
    );
  }
  const disputeId = openDispute[0].id;

  try {
    if (parsed.data.resolution === 'refund_client') {
      await refundContractOrder(order);
      await finalizeDispute(disputeId, 'refund_client', session.user.id, order.id, 'refunded');
    } else if (parsed.data.resolution === 'pay_freelancer') {
      // pay_freelancer means: net of platform fee, like a normal acceptance.
      // Stamp accepted_at so the transfer helper's idempotency key derives
      // from a stable time, and so the finance feed shows when it landed.
      const [stamped] = await db
        .update(contractOrders)
        .set({ acceptedAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(contractOrders.id, order.id))
        .returning();
      await createTransferForContractOrder(stamped);
      await finalizeDispute(disputeId, 'pay_freelancer', session.user.id, order.id, 'completed');
    } else {
      if (parsed.data.refundAmount >= order.amount) {
        return NextResponse.json(
          {
            error: `refundAmount (${parsed.data.refundAmount}) must be less than the contract amount (${order.amount})`,
          },
          { status: 400 },
        );
      }
      const transferAmount = order.amount - parsed.data.refundAmount;
      await refundPartialContractOrder(order, parsed.data.refundAmount);
      await createSplitTransferForContractOrder(order, transferAmount);
      await finalizeDispute(disputeId, 'split', session.user.id, order.id, 'completed');
    }
  } catch (err) {
    if (err instanceof RefundError || err instanceof TransferError) {
      console.error(`[resolve-contract-dispute] Stripe side-effect failed for ${id}:`, err);
      return NextResponse.json(
        {
          error: err.message,
          code: err.name === 'RefundError' ? 'refund_failed' : 'transfer_failed',
        },
        { status: 502 },
      );
    }
    if (err instanceof InvalidContractTransitionError) {
      return NextResponse.json(
        { error: 'Contract state changed before resolution could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }

  // Best-effort UI refresh so the side panel flips.
  try {
    const full = await fetchFullContract(order.contractId);
    if (full) {
      await broadcastContract(full.conversationId, 'contract_updated', full);
    }
  } catch (err) {
    console.error(`[resolve-contract-dispute] broadcast failed for ${order.contractId}:`, err);
  }

  await notifyContractDisputeResolved(order.contractId, order.id, parsed.data.resolution);

  return NextResponse.json({ ok: true });
}

async function finalizeDispute(
  disputeId: string,
  resolution: 'refund_client' | 'pay_freelancer' | 'split',
  resolvedBy: number,
  contractOrderId: string,
  toState: 'completed' | 'refunded',
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(contractOrderDisputes)
      .set({
        resolution,
        resolvedBy,
        resolvedAt: sql`now()`,
      })
      .where(eq(contractOrderDisputes.id, disputeId));
    await transitionContractOrder(contractOrderId, 'disputed', toState, {}, tx);
  });
}
