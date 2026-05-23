import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { serviceOrders, serviceOrderAddons, services } from '@/lib/db/schema/services';
import { contractOrders } from '@/lib/db/schema/contracts';
import { users } from '@/lib/db/schema';

const SO_ACTIVITY_STATES = [
  'paid',
  'in_progress',
  'delivered',
  'revision_requested',
  'accepted',
  'auto_accepted',
  'completed',
  'cancelled',
] as const;

export interface FinanceActivityItem {
  id: string;
  kind: 'service' | 'contract';
  state: string;
  currency: string;
  gross: number;
  fee: number;
  net: number;
  occurredAt: string;
  clientId: number;
  clientName: string;
  title: string;
  transferId: string | null;
}

function net(gross: number, feePct: string | number): { fee: number; net: number } {
  const pct = typeof feePct === 'string' ? Number(feePct) : feePct;
  const fee = Math.floor((gross * pct) / 100);
  return { fee, net: gross - fee };
}

/**
 * GET /api/finances/activity?limit=20&offset=0 — recent monetary activity
 * for the authenticated freelancer, merging service orders and contract
 * orders. Sorted by occurredAt desc. Used by /freelancer/finances.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    return await runActivity(req);
  } catch (err) {
    console.error('[/api/finances/activity] failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

async function runActivity(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const freelancerId = session.user.id;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);

  const soRows = await db
    .select({
      id: serviceOrders.id,
      state: serviceOrders.state,
      currency: serviceOrders.currency,
      basePrice: serviceOrders.basePrice,
      platformFeePct: serviceOrders.platformFeePct,
      acceptedAt: serviceOrders.acceptedAt,
      deliveredAt: serviceOrders.deliveredAt,
      createdAt: serviceOrders.createdAt,
      transferId: serviceOrders.transferId,
      clientId: serviceOrders.clientId,
      clientName: users.name,
      serviceTitle: services.title,
      addonsTotal: sql<number>`COALESCE((
        SELECT SUM(${serviceOrderAddons.price} * ${serviceOrderAddons.quantity})
        FROM ${serviceOrderAddons}
        WHERE ${serviceOrderAddons.orderId} = ${serviceOrders.id}
      ), 0)`,
    })
    .from(serviceOrders)
    .innerJoin(services, eq(services.id, serviceOrders.serviceId))
    .innerJoin(users, eq(users.id, serviceOrders.clientId))
    .where(
      and(
        eq(serviceOrders.freelancerId, freelancerId),
        inArray(serviceOrders.state, SO_ACTIVITY_STATES),
      ),
    )
    .orderBy(desc(serviceOrders.createdAt));

  const coRows = await db
    .select({
      id: contractOrders.id,
      state: contractOrders.state,
      currency: contractOrders.currency,
      amount: contractOrders.amount,
      platformFeePct: contractOrders.platformFeePct,
      acceptedAt: contractOrders.acceptedAt,
      deliveredAt: contractOrders.deliveredAt,
      createdAt: contractOrders.createdAt,
      transferId: contractOrders.transferId,
      clientId: contractOrders.clientId,
      clientName: users.name,
    })
    .from(contractOrders)
    .innerJoin(users, eq(users.id, contractOrders.clientId))
    .where(eq(contractOrders.freelancerId, freelancerId))
    .orderBy(desc(contractOrders.createdAt));

  const items: FinanceActivityItem[] = [];

  for (const r of soRows) {
    const gross = (r.basePrice ?? 0) + Number(r.addonsTotal ?? 0);
    const { fee, net: n } = net(gross, r.platformFeePct);
    const occurredAt = r.acceptedAt ?? r.deliveredAt ?? r.createdAt;
    items.push({
      id: r.id,
      kind: 'service',
      state: r.state,
      currency: r.currency,
      gross,
      fee,
      net: n,
      occurredAt,
      clientId: r.clientId,
      clientName: r.clientName,
      title: r.serviceTitle,
      transferId: r.transferId,
    });
  }

  for (const r of coRows) {
    const { fee, net: n } = net(r.amount ?? 0, r.platformFeePct);
    const occurredAt = r.acceptedAt ?? r.deliveredAt ?? r.createdAt;
    items.push({
      id: r.id,
      kind: 'contract',
      state: r.state,
      currency: r.currency,
      gross: r.amount ?? 0,
      fee,
      net: n,
      occurredAt,
      clientId: r.clientId,
      clientName: r.clientName,
      title: 'Contract',
      transferId: r.transferId,
    });
  }

  items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const page = items.slice(offset, offset + limit);
  return NextResponse.json({
    items: page,
    hasMore: items.length > offset + limit,
    total: items.length,
  });
}
