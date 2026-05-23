import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, asc, desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import {
  serviceOrderAddons,
  serviceOrderDeliveries,
  serviceOrderDisputes,
  serviceOrderRevisions,
  serviceOrders,
  services,
} from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

/**
 * GET /api/service-orders/:id — full order detail with addons, deliveries,
 * revisions, disputes, plus service + counterparty names. Visible to
 * either participant (client or freelancer); 404 otherwise.
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

  const clientUsers = alias(users, 'client_users');
  const freelancerUsers = alias(users, 'freelancer_users');

  const orderRows = await db
    .select({
      id: serviceOrders.id,
      serviceId: serviceOrders.serviceId,
      serviceTitle: services.title,
      clientId: serviceOrders.clientId,
      clientName: clientUsers.name,
      freelancerId: serviceOrders.freelancerId,
      freelancerName: freelancerUsers.name,
      basePrice: serviceOrders.basePrice,
      currency: serviceOrders.currency,
      platformFeePct: serviceOrders.platformFeePct,
      deliveryDeadline: serviceOrders.deliveryDeadline,
      autoAcceptDeadline: serviceOrders.autoAcceptDeadline,
      revisionsPurchased: serviceOrders.revisionsPurchased,
      revisionsUsed: serviceOrders.revisionsUsed,
      state: serviceOrders.state,
      paymentIntentId: serviceOrders.paymentIntentId,
      transferId: serviceOrders.transferId,
      createdAt: serviceOrders.createdAt,
      updatedAt: serviceOrders.updatedAt,
      deliveredAt: serviceOrders.deliveredAt,
      acceptedAt: serviceOrders.acceptedAt,
      cancelledAt: serviceOrders.cancelledAt,
    })
    .from(serviceOrders)
    .innerJoin(services, eq(services.id, serviceOrders.serviceId))
    .innerJoin(clientUsers, eq(clientUsers.id, serviceOrders.clientId))
    .innerJoin(freelancerUsers, eq(freelancerUsers.id, serviceOrders.freelancerId))
    .where(
      and(
        eq(serviceOrders.id, id),
        or(
          eq(serviceOrders.clientId, session.user.id),
          eq(serviceOrders.freelancerId, session.user.id),
        ),
      ),
    )
    .limit(1);

  if (orderRows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const order = orderRows[0];

  const [addons, deliveries, revisions, disputes] = await Promise.all([
    db
      .select()
      .from(serviceOrderAddons)
      .where(eq(serviceOrderAddons.orderId, id))
      .orderBy(asc(serviceOrderAddons.purchasedAt)),
    db
      .select()
      .from(serviceOrderDeliveries)
      .where(eq(serviceOrderDeliveries.orderId, id))
      .orderBy(desc(serviceOrderDeliveries.createdAt)),
    db
      .select()
      .from(serviceOrderRevisions)
      .where(eq(serviceOrderRevisions.orderId, id))
      .orderBy(desc(serviceOrderRevisions.createdAt)),
    db
      .select()
      .from(serviceOrderDisputes)
      .where(eq(serviceOrderDisputes.orderId, id))
      .orderBy(desc(serviceOrderDisputes.createdAt)),
  ]);

  return NextResponse.json({
    order,
    addons,
    deliveries,
    revisions,
    disputes,
    viewerRole:
      session.user.id === order.clientId ? 'client' : 'freelancer',
  });
}
