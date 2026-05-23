import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { contractOrders } from '@/lib/db/schema/contracts';
import {
  InvalidContractTransitionError,
  transitionContractOrder,
} from '@/lib/orders';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

// Mirror the service-order window so the cron config stays one knob.
const CONTRACT_AUTO_ACCEPT_DAYS = 7;

/**
 * POST /api/contracts/[contractId]/deliver — freelancer marks the
 * contract's paid work as delivered, starting the auto-accept clock.
 *
 *   paid → delivered  (delivered_at = now(), auto_accept_deadline = +7d)
 *
 * Mirrors the service-order deliver route — sets the deadline that the
 * cron uses to auto-release funds if the client doesn't accept manually.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  if (!z.string().uuid().safeParse(contractId).success) {
    return NextResponse.json({ error: 'Invalid contract id' }, { status: 400 });
  }

  const orders = await db
    .select()
    .from(contractOrders)
    .where(eq(contractOrders.contractId, contractId))
    .limit(1);
  if (orders.length === 0) {
    return NextResponse.json({ error: 'Contract has not been paid yet' }, { status: 409 });
  }
  const order = orders[0];

  if (session.user.id !== order.freelancerId) {
    return NextResponse.json(
      { error: 'Only the freelancer can deliver this contract' },
      { status: 403 },
    );
  }

  if (order.state !== 'paid') {
    return NextResponse.json(
      { error: `Contract order in state '${order.state}' cannot be delivered` },
      { status: 409 },
    );
  }

  const deadline = new Date();
  deadline.setUTCDate(deadline.getUTCDate() + CONTRACT_AUTO_ACCEPT_DAYS);

  try {
    await transitionContractOrder(order.id, 'paid', 'delivered', {
      deliveredAt: sql`now()`,
      autoAcceptDeadline: deadline.toISOString(),
    });
  } catch (err) {
    if (err instanceof InvalidContractTransitionError) {
      return NextResponse.json(
        { error: 'Contract state changed before delivery could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }

  const full = await fetchFullContract(contractId);
  if (!full) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Best-effort UI refresh — broadcast errors are logged, not swallowed.
  try {
    await broadcastContract(full.conversationId, 'contract_updated', full);
  } catch (err) {
    console.error(`[contract deliver] broadcast failed for ${contractId}:`, err);
  }

  return NextResponse.json({ contract: full });
}
