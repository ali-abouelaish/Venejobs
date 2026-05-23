import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/drizzle';
import { serviceAddons, services } from '@/lib/db/schema/services';
import { PLATFORM_FEE_PCT } from '@/lib/config/fees';

const CheckoutSchema = z.object({
  serviceId: z.string().uuid(),
  addons: z
    .array(
      z.object({
        addonId: z.string().uuid(),
        quantity: z.number().int().positive().max(100),
      }),
    )
    .max(20)
    .optional(),
});

/**
 * POST /api/service-orders/checkout — create a Stripe Embedded Checkout
 * Session for a service + selected add-ons. Returns the client_secret
 * for the frontend to mount.
 *
 * No transfer_data and no application_fee_amount: funds land on the
 * platform balance first; transfers to the freelancer happen later, at
 * acceptance time (Phase 5). The service_orders row is created by the
 * checkout.session.completed webhook, not here.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { serviceId, addons: addonRequests = [] } = parsed.data;

  const serviceRows = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  if (serviceRows.length === 0) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }
  const service = serviceRows[0];

  if (service.status !== 'published') {
    return NextResponse.json(
      { error: 'Service not available for purchase' },
      { status: 409 },
    );
  }
  if (service.freelancerId === session.user.id) {
    return NextResponse.json(
      { error: 'Cannot purchase your own service' },
      { status: 409 },
    );
  }

  const addonIds = addonRequests.map((a) => a.addonId);
  type AddonRow = typeof serviceAddons.$inferSelect;
  let addonRows: AddonRow[] = [];
  if (addonIds.length > 0) {
    addonRows = await db
      .select()
      .from(serviceAddons)
      .where(
        and(inArray(serviceAddons.id, addonIds), eq(serviceAddons.serviceId, serviceId)),
      );
    if (addonRows.length !== addonIds.length) {
      return NextResponse.json(
        { error: 'One or more addons not found on this service' },
        { status: 400 },
      );
    }
  }
  const addonMap = new Map(addonRows.map((a) => [a.id, a]));

  let revisionsPurchased = service.baseRevisions;
  for (const r of addonRequests) {
    const addon = addonMap.get(r.addonId)!;
    if (addon.maxQuantity != null && r.quantity > addon.maxQuantity) {
      return NextResponse.json(
        { error: `Quantity for addon '${addon.name}' exceeds max ${addon.maxQuantity}` },
        { status: 400 },
      );
    }
    if (addon.type === 'revision') {
      revisionsPurchased += r.quantity;
    }
  }

  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: service.currency,
        unit_amount: service.basePrice,
        product_data: {
          name: service.title,
          description: service.description.slice(0, 200),
          metadata: { kind: 'base', service_id: service.id },
        },
      },
    },
    ...addonRequests.map((r) => {
      const addon = addonMap.get(r.addonId)!;
      return {
        quantity: r.quantity,
        price_data: {
          currency: service.currency,
          unit_amount: addon.price,
          product_data: {
            name: addon.name,
            ...(addon.description ? { description: addon.description } : {}),
            metadata: { kind: 'addon', addon_id: addon.id, type: addon.type },
          },
        },
      };
    }),
  ];

  const origin = req.nextUrl.origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    line_items: lineItems,
    payment_intent_data: {
      metadata: {
        service_id: service.id,
        client_id: String(session.user.id),
      },
    },
    metadata: {
      kind: 'service_base',
      service_id: service.id,
      client_id: String(session.user.id),
      freelancer_id: String(service.freelancerId),
      currency: service.currency,
      delivery_days: String(service.deliveryDays),
      revisions_purchased: String(revisionsPurchased),
      platform_fee_pct: PLATFORM_FEE_PCT.toFixed(2),
    },
    return_url: `${origin}/services/${service.id}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
  });

  return NextResponse.json({ clientSecret: checkoutSession.client_secret });
}
