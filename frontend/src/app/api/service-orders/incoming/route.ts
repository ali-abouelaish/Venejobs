import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { serviceOrders, services } from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

/** GET /api/service-orders/incoming — list orders where I'm the freelancer. */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id: serviceOrders.id,
      serviceId: serviceOrders.serviceId,
      serviceTitle: services.title,
      clientId: serviceOrders.clientId,
      clientName: users.name,
      basePrice: serviceOrders.basePrice,
      currency: serviceOrders.currency,
      state: serviceOrders.state,
      deliveryDeadline: serviceOrders.deliveryDeadline,
      autoAcceptDeadline: serviceOrders.autoAcceptDeadline,
      revisionsPurchased: serviceOrders.revisionsPurchased,
      revisionsUsed: serviceOrders.revisionsUsed,
      createdAt: serviceOrders.createdAt,
      deliveredAt: serviceOrders.deliveredAt,
      acceptedAt: serviceOrders.acceptedAt,
    })
    .from(serviceOrders)
    .innerJoin(services, eq(services.id, serviceOrders.serviceId))
    .innerJoin(users, eq(users.id, serviceOrders.clientId))
    .where(eq(serviceOrders.freelancerId, session.user.id))
    .orderBy(desc(serviceOrders.createdAt));

  return NextResponse.json(rows);
}
