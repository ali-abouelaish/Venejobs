import { NextRequest, NextResponse } from 'next/server';
import { and, eq, lt, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { serviceOrders } from '@/lib/db/schema/services';
import { contractOrders } from '@/lib/db/schema/contracts';
import { reviews } from '@/lib/db/schema/reviews';
import {
  InvalidContractTransitionError,
  InvalidTransitionError,
  transitionContractOrder,
  transitionServiceOrder,
} from '@/lib/orders';
import {
  TransferError,
  createTransferForContractOrder,
  createTransferForOrder,
} from '@/lib/transfers';
import { notifyOrderAccepted } from '@/lib/email/notifications';

/**
 * POST /api/cron/auto-accept — scan delivered orders past their
 * auto_accept_deadline, transition each to auto_accepted, and create the
 * Stripe Transfer for the freelancer's payout.
 *
 * Auth: x-cron-secret header must match CRON_SECRET. The scheduler
 * (Vercel Cron, GitHub Actions, cron-job.org, etc.) supplies the header.
 *
 * Idempotent across the scan loop: the state machine CAS in
 * transitionServiceOrder makes a double-fired scheduler harmless (the
 * second pass sees state=auto_accepted and skips). Transfer creation
 * uses an idempotency key derived from order_id so a transfer that was
 * created on a prior pass is returned, not duplicated.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 503 },
    );
  }
  const provided = req.headers.get('x-cron-secret');
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const due = await db
    .select()
    .from(serviceOrders)
    .where(
      and(
        eq(serviceOrders.state, 'delivered'),
        lte(serviceOrders.autoAcceptDeadline, sql`now()`),
      ),
    );

  let processed = 0;
  let failed = 0;
  const errors: Array<{ orderId: string; stage: string; message: string }> = [];

  for (const order of due) {
    try {
      const accepted = await transitionServiceOrder(
        order.id,
        'delivered',
        'auto_accepted',
        { acceptedAt: sql`now()` },
      );
      try {
        await createTransferForOrder(accepted);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ orderId: order.id, stage: 'transfer', message: msg });
        failed++;
        continue;
      }
      await notifyOrderAccepted(order.id, { auto: true });
      processed++;
    } catch (e) {
      if (e instanceof InvalidTransitionError) {
        // Race with the accept endpoint or a prior cron pass — skip.
        continue;
      }
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ orderId: order.id, stage: 'transition', message: msg });
      failed++;
    }
  }

  // Second pass: contract_orders past their auto-accept deadline.
  // Mirrors the service-order block above — same idempotency story via
  // the CAS in transitionContractOrder and the per-order Stripe
  // idempotency key inside createTransferForContractOrder.
  const dueContracts = await db
    .select()
    .from(contractOrders)
    .where(
      and(
        eq(contractOrders.state, 'delivered'),
        lte(contractOrders.autoAcceptDeadline, sql`now()`),
      ),
    );

  let contractsProcessed = 0;
  let contractsFailed = 0;
  const contractErrors: Array<{ contractOrderId: string; stage: string; message: string }> = [];

  for (const order of dueContracts) {
    try {
      const accepted = await transitionContractOrder(
        order.id,
        'delivered',
        'auto_accepted',
        { acceptedAt: sql`now()` },
      );
      try {
        await createTransferForContractOrder(accepted);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        contractErrors.push({ contractOrderId: order.id, stage: 'transfer', message: msg });
        contractsFailed++;
        continue;
      }
      contractsProcessed++;
    } catch (e) {
      if (e instanceof InvalidContractTransitionError) {
        // Race with the accept endpoint or a prior cron pass — skip.
        continue;
      }
      const msg = e instanceof Error ? e.message : String(e);
      contractErrors.push({ contractOrderId: order.id, stage: 'transition', message: msg });
      contractsFailed++;
    }
  }

  // Third pass: auto-publish pending reviews whose order was accepted
  // more than 14 days ago. Back-stop for the double-blind window — if a
  // counterparty never reviews, the pending review still surfaces after
  // the window closes.
  //
  // Per-row transactions, not a bulk UPDATE, so a failure on one review
  // doesn't roll back others published on this run. Idempotent: a row
  // published on a prior run is filtered out by status='pending' in the
  // scan and would also no-op in the UPDATE's WHERE clause.
  const duePending = await db
    .select({ id: reviews.id })
    .from(reviews)
    .innerJoin(serviceOrders, eq(serviceOrders.id, reviews.serviceOrderId))
    .where(
      and(
        eq(reviews.status, 'pending'),
        lt(serviceOrders.acceptedAt, sql`now() - interval '14 days'`),
      ),
    );

  let reviewsPublished = 0;
  let reviewsFailed = 0;
  const reviewErrors: Array<{ reviewId: string; message: string }> = [];

  for (const { id: reviewId } of duePending) {
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(reviews)
          .set({ status: 'published', publishedAt: sql`now()` })
          .where(and(eq(reviews.id, reviewId), eq(reviews.status, 'pending')));
      });
      reviewsPublished++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reviewErrors.push({ reviewId, message: msg });
      reviewsFailed++;
    }
  }

  return NextResponse.json({
    scanned: due.length,
    processed,
    failed,
    errors,
    contracts: {
      scanned: dueContracts.length,
      processed: contractsProcessed,
      failed: contractsFailed,
      errors: contractErrors,
    },
    reviews: {
      scanned: duePending.length,
      published: reviewsPublished,
      failed: reviewsFailed,
      errors: reviewErrors,
    },
  });
}
