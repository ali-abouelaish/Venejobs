import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { assertServiceOrderAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { serviceOrderDisputes } from '@/lib/db/schema/services';
import { InvalidTransitionError, transitionServiceOrder } from '@/lib/orders';
import { notifyOrderDisputed } from '@/lib/email/notifications';

const AttachmentSchema = z.object({
  r2Key: z.string().min(1),
  filename: z.string().min(1),
  size: z.number().int().positive(),
  mime: z.string().min(1),
});

const DisputeSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
  attachments: z.array(AttachmentSchema).min(1, 'At least one evidence file is required'),
});

const DISPUTABLE_FROM = new Set(['delivered', 'revision_requested']);

/**
 * POST /api/service-orders/:id/dispute — client raises a dispute.
 *
 * Inserts a service_order_disputes row, transitions the order to
 * 'disputed' and clears auto_accept_deadline so the auto-accept cron
 * stops considering it. Resolution is manual via the admin endpoint.
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
  if (!DISPUTABLE_FROM.has(order.state)) {
    return NextResponse.json(
      { error: `Order in state '${order.state}' cannot be disputed` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = DisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [dispute] = await tx
        .insert(serviceOrderDisputes)
        .values({
          orderId: order.id,
          raisedBy: session.user.id,
          reason: parsed.data.reason,
          attachments: parsed.data.attachments,
        })
        .returning();

      const updatedOrder = await transitionServiceOrder(
        order.id,
        order.state,
        'disputed',
        { autoAcceptDeadline: null },
        tx,
      );

      return { dispute, order: updatedOrder };
    });

    await notifyOrderDisputed(order.id, parsed.data.reason);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        { error: 'Order state changed before dispute could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }
}
