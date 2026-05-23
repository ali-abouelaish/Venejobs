import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, asc, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceOrderAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  serviceAddons,
  serviceOrderRevisions,
} from '@/lib/db/schema/services';
import { InvalidTransitionError, transitionServiceOrder } from '@/lib/orders';
import { notifyOrderRevisionRequested } from '@/lib/email/notifications';

const RequestRevisionSchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

/**
 * POST /api/service-orders/:id/request-revision — client requests a
 * revision on a delivered order.
 *
 * - If revisions_used < revisions_purchased: insert a revision row and
 *   transition delivered → revision_requested → in_progress (atomic),
 *   clear auto_accept_deadline, increment revisions_used.
 * - Else: return 402 with code='revisions_exhausted' and the list of
 *   revision-type add-ons available on the original service so the
 *   client can buy more via POST /buy-revisions, then re-submit.
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

  const order = await assertServiceOrderAccess(id, session.user.id, 'client');
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.state !== 'delivered') {
    return NextResponse.json(
      { error: `Order in state '${order.state}' cannot accept a revision request` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestRevisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const remaining = order.revisionsPurchased - order.revisionsUsed;
  if (remaining <= 0) {
    const availableAddons = await db
      .select({
        id: serviceAddons.id,
        name: serviceAddons.name,
        description: serviceAddons.description,
        price: serviceAddons.price,
        maxQuantity: serviceAddons.maxQuantity,
      })
      .from(serviceAddons)
      .where(
        and(
          eq(serviceAddons.serviceId, order.serviceId),
          eq(serviceAddons.type, 'revision'),
        ),
      )
      .orderBy(asc(serviceAddons.sortOrder));

    return NextResponse.json(
      {
        error: 'Revisions exhausted',
        code: 'revisions_exhausted',
        revisionsUsed: order.revisionsUsed,
        revisionsPurchased: order.revisionsPurchased,
        availableAddons,
      },
      { status: 402 },
    );
  }

  try {
    const updated = await db.transaction(async (tx) => {
      await tx.insert(serviceOrderRevisions).values({
        orderId: order.id,
        clientId: session.user.id,
        message: parsed.data.message,
      });

      await transitionServiceOrder(
        order.id,
        'delivered',
        'revision_requested',
        { autoAcceptDeadline: null },
        tx,
      );

      return await transitionServiceOrder(
        order.id,
        'revision_requested',
        'in_progress',
        { revisionsUsed: sql`revisions_used + 1` },
        tx,
      );
    });

    await notifyOrderRevisionRequested(order.id, parsed.data.message);

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: 'Order state changed before revision could be applied' },
        { status: 409 },
      );
    }
    throw err;
  }
}
