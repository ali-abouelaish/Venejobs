import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceOrderAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { serviceOrderDeliveries } from '@/lib/db/schema/services';
import { InvalidTransitionError, transitionServiceOrder } from '@/lib/orders';
import { notifyOrderDelivered } from '@/lib/email/notifications';

const AUTO_ACCEPT_DAYS = 7;

const DeliverSchema = z.object({
  message: z.string().trim().max(5000).optional(),
  attachments: z
    .array(
      z.object({
        r2Key: z.string().min(1),
        filename: z.string().min(1),
        size: z.number().int().positive(),
        mime: z.string().min(1),
      }),
    )
    .max(20)
    .default([]),
});

// 'revision_requested' is accepted as a courtesy: the state machine
// disallows revision_requested -> delivered directly, so we route through
// in_progress inside the transaction. This means a freelancer never has to
// click a separate "resume work" button just to re-deliver a revision.
const DELIVERABLE_FROM = new Set(['paid', 'in_progress', 'revision_requested']);

/**
 * POST /api/service-orders/:id/deliver — freelancer submits delivery.
 * Inserts a service_order_deliveries row and transitions the order to
 * 'delivered' atomically, setting delivered_at = now() and
 * auto_accept_deadline = now() + 7 days.
 *
 * If the order is in 'revision_requested', we first move it to
 * 'in_progress' (a valid transition), then to 'delivered'. Both steps
 * happen inside the same transaction so partial state is impossible.
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

  const order = await assertServiceOrderAccess(id, session.user.id, 'freelancer');
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!DELIVERABLE_FROM.has(order.state)) {
    return NextResponse.json(
      { error: `Order in state '${order.state}' cannot be delivered` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = DeliverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const deadline = new Date();
  deadline.setUTCDate(deadline.getUTCDate() + AUTO_ACCEPT_DAYS);

  try {
    const updated = await db.transaction(async (tx) => {
      await tx.insert(serviceOrderDeliveries).values({
        orderId: order.id,
        freelancerId: session.user.id,
        message: parsed.data.message ?? null,
        attachments: parsed.data.attachments,
      });

      // From 'revision_requested' we must first hop to 'in_progress',
      // since the state machine disallows revision_requested -> delivered.
      if (order.state === 'revision_requested') {
        await transitionServiceOrder(
          order.id,
          'revision_requested',
          'in_progress',
          {},
          tx,
        );
        return await transitionServiceOrder(
          order.id,
          'in_progress',
          'delivered',
          {
            deliveredAt: sql`now()`,
            autoAcceptDeadline: deadline.toISOString(),
          },
          tx,
        );
      }

      return await transitionServiceOrder(
        order.id,
        order.state,
        'delivered',
        {
          deliveredAt: sql`now()`,
          autoAcceptDeadline: deadline.toISOString(),
        },
        tx,
      );
    });

    await notifyOrderDelivered(order.id);

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: 'Order state changed before delivery could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }
}
