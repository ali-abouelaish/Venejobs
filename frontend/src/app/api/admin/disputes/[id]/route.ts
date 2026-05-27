import { NextRequest, NextResponse } from 'next/server';
import { alias } from 'drizzle-orm/pg-core';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  serviceOrderDeliveries,
  serviceOrderDisputes,
  serviceOrders,
  services,
} from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

/**
 * GET /api/admin/disputes/:id — admin-only. Returns a single
 * service-order dispute with the parent order, service title, both
 * parties, and every delivery (with attachments) so the admin has the
 * full evidence trail on one page.
 */
export async function GET(
  _req: NextRequest,
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

  const clientUsers = alias(users, 'client_users');
  const freelancerUsers = alias(users, 'freelancer_users');
  const raisedByUsers = alias(users, 'raised_by_users');
  const resolvedByUsers = alias(users, 'resolved_by_users');

  const rows = await db
    .select({
      id: serviceOrderDisputes.id,
      orderId: serviceOrderDisputes.orderId,
      reason: serviceOrderDisputes.reason,
      attachments: serviceOrderDisputes.attachments,
      resolution: serviceOrderDisputes.resolution,
      resolvedAt: serviceOrderDisputes.resolvedAt,
      resolvedByName: resolvedByUsers.name,
      createdAt: serviceOrderDisputes.createdAt,
      raisedById: serviceOrderDisputes.raisedBy,
      raisedByName: raisedByUsers.name,
      orderState: serviceOrders.state,
      basePrice: serviceOrders.basePrice,
      currency: serviceOrders.currency,
      deliveryDeadline: serviceOrders.deliveryDeadline,
      deliveredAt: serviceOrders.deliveredAt,
      acceptedAt: serviceOrders.acceptedAt,
      revisionsPurchased: serviceOrders.revisionsPurchased,
      revisionsUsed: serviceOrders.revisionsUsed,
      serviceId: services.id,
      serviceTitle: services.title,
      clientId: serviceOrders.clientId,
      clientName: clientUsers.name,
      freelancerId: serviceOrders.freelancerId,
      freelancerName: freelancerUsers.name,
    })
    .from(serviceOrderDisputes)
    .innerJoin(serviceOrders, eq(serviceOrders.id, serviceOrderDisputes.orderId))
    .innerJoin(services, eq(services.id, serviceOrders.serviceId))
    .innerJoin(clientUsers, eq(clientUsers.id, serviceOrders.clientId))
    .innerJoin(freelancerUsers, eq(freelancerUsers.id, serviceOrders.freelancerId))
    .innerJoin(raisedByUsers, eq(raisedByUsers.id, serviceOrderDisputes.raisedBy))
    .leftJoin(resolvedByUsers, eq(resolvedByUsers.id, serviceOrderDisputes.resolvedBy))
    .where(eq(serviceOrderDisputes.id, id))
    .limit(1);

  const dispute = rows[0];
  if (!dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  const freelancerForDeliveries = alias(users, 'delivery_freelancer');
  const deliveries = await db
    .select({
      id: serviceOrderDeliveries.id,
      message: serviceOrderDeliveries.message,
      attachments: serviceOrderDeliveries.attachments,
      createdAt: serviceOrderDeliveries.createdAt,
      freelancerId: serviceOrderDeliveries.freelancerId,
      freelancerName: freelancerForDeliveries.name,
    })
    .from(serviceOrderDeliveries)
    .innerJoin(
      freelancerForDeliveries,
      eq(freelancerForDeliveries.id, serviceOrderDeliveries.freelancerId),
    )
    .where(eq(serviceOrderDeliveries.orderId, dispute.orderId))
    .orderBy(asc(serviceOrderDeliveries.createdAt));

  return NextResponse.json({ dispute, deliveries });
}
