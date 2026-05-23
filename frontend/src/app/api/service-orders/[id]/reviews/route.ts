import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceOrderParticipant } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { serviceOrders } from '@/lib/db/schema/services';
import { reviews } from '@/lib/db/schema/reviews';

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(5000),
});

// state ∈ this set AND accepted_at IS NOT NULL means the order has reached
// client acceptance (manual or auto). Reviews are gated to this happy path.
const REVIEWABLE_STATES = new Set(['accepted', 'auto_accepted', 'completed']);

/**
 * POST /api/service-orders/:id/reviews — caller submits their review of
 * the counterparty on this order.
 *
 * The flow is wrapped in a transaction with SELECT … FOR UPDATE on the
 * service_orders row so two concurrent reviewers on the same order
 * serialize: the second reviewer's transaction sees the first
 * reviewer's row when it counts, and the conditional publish fires
 * exactly once.
 */
export async function POST(
  req: NextRequest,
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

  const participant = await assertServiceOrderParticipant(id, session.user.id);
  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const { row: order, role } = participant;

  if (!REVIEWABLE_STATES.has(order.state) || !order.acceptedAt) {
    return NextResponse.json(
      { error: `Order in state '${order.state}' is not reviewable` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const revieweeId = role === 'client' ? order.freelancerId : order.clientId;

  const result = await db.transaction(async (tx) => {
    // Serialize concurrent reviewers on this order.
    await tx
      .select({ id: serviceOrders.id })
      .from(serviceOrders)
      .where(eq(serviceOrders.id, order.id))
      .for('update');

    const existing = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.serviceOrderId, order.id),
          eq(reviews.reviewerId, session.user.id),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      return { conflict: 'already_reviewed' as const };
    }

    const [created] = await tx
      .insert(reviews)
      .values({
        serviceOrderId: order.id,
        reviewerId: session.user.id,
        revieweeId,
        reviewerRole: role,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        status: 'pending',
      })
      .returning();

    const allOnOrder = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.serviceOrderId, order.id));

    if (allOnOrder.length === 2) {
      const published = await tx
        .update(reviews)
        .set({ status: 'published', publishedAt: sql`now()` })
        .where(
          and(
            eq(reviews.serviceOrderId, order.id),
            eq(reviews.status, 'pending'),
          ),
        )
        .returning();
      const updatedSelf = published.find((r) => r.id === created.id) ?? created;
      return { review: updatedSelf, published: true as const };
    }

    return { review: created, published: false as const };
  });

  if ('conflict' in result) {
    return NextResponse.json(
      { error: 'You have already reviewed this order' },
      { status: 409 },
    );
  }

  return NextResponse.json(result, { status: 201 });
}

/**
 * GET /api/service-orders/:id/reviews — return the caller's own review
 * (any status) and the counterparty's review only if it is published.
 * Pending counterparty reviews are intentionally not exposed: that is
 * the double-blind contract.
 */
export async function GET(
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

  const participant = await assertServiceOrderParticipant(id, session.user.id);
  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.serviceOrderId, id));

  const myReview = rows.find((r) => r.reviewerId === session.user.id) ?? null;
  const otherRow = rows.find((r) => r.reviewerId !== session.user.id) ?? null;
  const counterpartyReview =
    otherRow && otherRow.status === 'published' ? otherRow : null;

  return NextResponse.json({ myReview, counterpartyReview });
}
