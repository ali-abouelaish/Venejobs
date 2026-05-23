import { NextResponse } from 'next/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { serviceOrders, serviceOrderAddons } from '@/lib/db/schema/services';
import { contractOrders } from '@/lib/db/schema/contracts';

// Money is integer pence. Net = gross - floor(gross * platform_fee_pct / 100),
// matching computeOrderPayout() in src/lib/transfers.ts. Doing the math in
// JS to keep parity with that single source of truth.

const SO_EARNED_STATES = ['accepted', 'auto_accepted', 'completed'] as const;
const SO_PENDING_STATES = ['paid', 'in_progress', 'delivered', 'revision_requested'] as const;

const CO_EARNED_STATES = ['accepted', 'auto_accepted', 'completed'] as const;
const CO_PENDING_STATES = ['paid', 'delivered'] as const;

interface CurrencyBucket {
  lifetimeEarned: number;
  pending: number;
  thisMonth: number;
  earnedCount: number;
  pendingCount: number;
}

function emptyBucket(): CurrencyBucket {
  return { lifetimeEarned: 0, pending: 0, thisMonth: 0, earnedCount: 0, pendingCount: 0 };
}

function net(gross: number, feePct: string | number): number {
  const pct = typeof feePct === 'string' ? Number(feePct) : feePct;
  return gross - Math.floor((gross * pct) / 100);
}

/**
 * GET /api/finances/summary — earnings rollups grouped by currency for
 * the authenticated freelancer. Net amounts mirror transfers.ts.
 */
export async function GET(): Promise<NextResponse> {
  try {
    return await runSummary();
  } catch (err) {
    console.error('[/api/finances/summary] failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

async function runSummary(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const freelancerId = session.user.id;

  // Service orders + summed addons. group by order so we can compute net
  // per order, since fee_pct is per-row.
  const soRows = await db
    .select({
      id: serviceOrders.id,
      state: serviceOrders.state,
      currency: serviceOrders.currency,
      basePrice: serviceOrders.basePrice,
      platformFeePct: serviceOrders.platformFeePct,
      acceptedAt: serviceOrders.acceptedAt,
      createdAt: serviceOrders.createdAt,
      addonsTotal: sql<number>`COALESCE((
        SELECT SUM(${serviceOrderAddons.price} * ${serviceOrderAddons.quantity})
        FROM ${serviceOrderAddons}
        WHERE ${serviceOrderAddons.orderId} = ${serviceOrders.id}
      ), 0)`,
    })
    .from(serviceOrders)
    .where(
      and(
        eq(serviceOrders.freelancerId, freelancerId),
        inArray(serviceOrders.state, [...SO_EARNED_STATES, ...SO_PENDING_STATES]),
      ),
    );

  const coRows = await db
    .select({
      id: contractOrders.id,
      state: contractOrders.state,
      currency: contractOrders.currency,
      amount: contractOrders.amount,
      platformFeePct: contractOrders.platformFeePct,
      acceptedAt: contractOrders.acceptedAt,
      createdAt: contractOrders.createdAt,
    })
    .from(contractOrders)
    .where(
      and(
        eq(contractOrders.freelancerId, freelancerId),
        inArray(contractOrders.state, [...CO_EARNED_STATES, ...CO_PENDING_STATES]),
      ),
    );

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const byCurrency: Record<string, CurrencyBucket> = {};
  function bucket(cur: string): CurrencyBucket {
    const key = cur.toLowerCase();
    if (!byCurrency[key]) byCurrency[key] = emptyBucket();
    return byCurrency[key];
  }

  for (const r of soRows) {
    const gross = (r.basePrice ?? 0) + Number(r.addonsTotal ?? 0);
    const n = net(gross, r.platformFeePct);
    const b = bucket(r.currency);
    if ((SO_EARNED_STATES as readonly string[]).includes(r.state)) {
      b.lifetimeEarned += n;
      b.earnedCount += 1;
      const occurredAt = r.acceptedAt ? new Date(r.acceptedAt) : new Date(r.createdAt);
      if (occurredAt.getTime() >= startOfMonth.getTime()) {
        b.thisMonth += n;
      }
    } else {
      b.pending += n;
      b.pendingCount += 1;
    }
  }

  // Contract orders share the service-order earned/pending split, minus
  // the revision_requested / disputed branches that contracts don't have.
  for (const r of coRows) {
    const n = net(r.amount ?? 0, r.platformFeePct);
    const b = bucket(r.currency);
    if ((CO_EARNED_STATES as readonly string[]).includes(r.state)) {
      b.lifetimeEarned += n;
      b.earnedCount += 1;
      const occurredAt = r.acceptedAt ? new Date(r.acceptedAt) : new Date(r.createdAt);
      if (occurredAt.getTime() >= startOfMonth.getTime()) {
        b.thisMonth += n;
      }
    } else {
      b.pending += n;
      b.pendingCount += 1;
    }
  }

  return NextResponse.json({ byCurrency });
}
