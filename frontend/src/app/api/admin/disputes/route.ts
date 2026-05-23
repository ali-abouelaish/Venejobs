import { NextRequest, NextResponse } from 'next/server';
import { alias } from 'drizzle-orm/pg-core';
import { desc, eq, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import {
  serviceOrderDisputes,
  serviceOrders,
  services,
} from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

/**
 * GET /api/admin/disputes — admin-only. Lists disputes. Defaults to
 * open disputes (resolution IS NULL); pass ?resolved=true to include
 * resolved ones.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const showResolved = req.nextUrl.searchParams.get('resolved') === 'true';

  const clientUsers = alias(users, 'client_users');
  const freelancerUsers = alias(users, 'freelancer_users');
  const raisedByUsers = alias(users, 'raised_by_users');

  const baseQuery = db
    .select({
      id: serviceOrderDisputes.id,
      orderId: serviceOrderDisputes.orderId,
      reason: serviceOrderDisputes.reason,
      resolution: serviceOrderDisputes.resolution,
      resolvedBy: serviceOrderDisputes.resolvedBy,
      resolvedAt: serviceOrderDisputes.resolvedAt,
      createdAt: serviceOrderDisputes.createdAt,
      raisedById: serviceOrderDisputes.raisedBy,
      raisedByName: raisedByUsers.name,
      orderState: serviceOrders.state,
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
    .innerJoin(raisedByUsers, eq(raisedByUsers.id, serviceOrderDisputes.raisedBy));

  const rows = showResolved
    ? await baseQuery.orderBy(desc(serviceOrderDisputes.createdAt))
    : await baseQuery
        .where(isNull(serviceOrderDisputes.resolution))
        .orderBy(desc(serviceOrderDisputes.createdAt));

  return NextResponse.json(rows);
}
