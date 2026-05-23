import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceOrderAccess } from '@/lib/assertions';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { serviceAddons } from '@/lib/db/schema/services';

const BuyRevisionsSchema = z.object({
  addons: z
    .array(
      z.object({
        addonId: z.string().uuid(),
        quantity: z.number().int().positive().max(100),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * POST /api/service-orders/:id/buy-revisions — create an Embedded
 * Checkout Session for additional revision add-ons against an existing
 * delivered order. Returns the client_secret.
 *
 * On payment, the checkout.session.completed handler (kind='service_addon')
 * inserts service_order_addons rows and bumps revisions_purchased on
 * the order. The client must then re-submit POST /request-revision
 * with the revision message to actually consume the new revisions —
 * server doesn't auto-apply the pending request.
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
      { error: `Cannot buy revisions on an order in state '${order.state}'` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BuyRevisionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const addonIds = parsed.data.addons.map((a) => a.addonId);
  const addonRows = await db
    .select()
    .from(serviceAddons)
    .where(
      and(
        inArray(serviceAddons.id, addonIds),
        eq(serviceAddons.serviceId, order.serviceId),
        eq(serviceAddons.type, 'revision'),
      ),
    );
  if (addonRows.length !== addonIds.length) {
    return NextResponse.json(
      { error: 'One or more addons not found, do not belong to this service, or are not revision-type' },
      { status: 400 },
    );
  }
  const addonMap = new Map(addonRows.map((a) => [a.id, a]));

  for (const r of parsed.data.addons) {
    const addon = addonMap.get(r.addonId)!;
    if (addon.maxQuantity != null && r.quantity > addon.maxQuantity) {
      return NextResponse.json(
        { error: `Quantity for addon '${addon.name}' exceeds max ${addon.maxQuantity}` },
        { status: 400 },
      );
    }
  }

  const lineItems = parsed.data.addons.map((r) => {
    const addon = addonMap.get(r.addonId)!;
    return {
      quantity: r.quantity,
      price_data: {
        currency: order.currency,
        unit_amount: addon.price,
        product_data: {
          name: addon.name,
          ...(addon.description ? { description: addon.description } : {}),
          metadata: { kind: 'addon', addon_id: addon.id, type: 'revision' },
        },
      },
    };
  });

  const origin = req.nextUrl.origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    line_items: lineItems,
    payment_intent_data: {
      metadata: {
        order_id: order.id,
        kind: 'service_addon',
      },
    },
    metadata: {
      kind: 'service_addon',
      order_id: order.id,
      client_id: String(order.clientId),
      freelancer_id: String(order.freelancerId),
      currency: order.currency,
    },
    return_url: `${origin}/services/${order.serviceId}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
  });

  return NextResponse.json({ clientSecret: checkoutSession.client_secret });
}
