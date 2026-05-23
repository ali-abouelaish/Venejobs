import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import {
  contractOrderDisputes,
  contractOrders,
} from '@/lib/db/schema/contracts';
import {
  InvalidContractTransitionError,
  transitionContractOrder,
} from '@/lib/orders';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';
import { notifyContractDisputed } from '@/lib/email/notifications';

const DisputeSchema = z.object({
  reason: z.string().trim().min(1, 'Reason required').max(2000),
});

const DISPUTABLE_FROM = new Set(['paid', 'delivered']);

/**
 * POST /api/contracts/[contractId]/dispute — either party raises a
 * dispute against a paid or delivered contract. Freezes the auto-accept
 * clock by transitioning state to 'disputed', writes the dispute row,
 * and broadcasts so both side panels flip to the disputed banner.
 *
 * Admin resolves via /api/admin/contract-orders/[id]/resolve-dispute.
 *
 * Mirrors the service-order dispute flow at
 * src/app/api/service-orders/[id]/dispute/route.ts.
 */
export async function POST(
  req: NextRequest,
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

  const body = await req.json().catch(() => null);
  const parsed = DisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const orders = await db
    .select()
    .from(contractOrders)
    .where(eq(contractOrders.contractId, contractId))
    .limit(1);
  if (orders.length === 0) {
    return NextResponse.json(
      { error: 'Contract has not been paid yet' },
      { status: 409 },
    );
  }
  const order = orders[0];

  if (session.user.id !== order.clientId && session.user.id !== order.freelancerId) {
    return NextResponse.json(
      { error: 'Only the client or freelancer can dispute this contract' },
      { status: 403 },
    );
  }

  if (!DISPUTABLE_FROM.has(order.state)) {
    return NextResponse.json(
      { error: `Contract order in state '${order.state}' cannot be disputed` },
      { status: 409 },
    );
  }

  // An open dispute already exists — short-circuit (idempotent). Lets a
  // double-click on the button no-op instead of failing.
  const open = await db
    .select({ id: contractOrderDisputes.id })
    .from(contractOrderDisputes)
    .where(
      and(
        eq(contractOrderDisputes.contractOrderId, order.id),
        isNull(contractOrderDisputes.resolution),
      ),
    )
    .limit(1);
  if (open.length > 0) {
    return NextResponse.json({ error: 'A dispute is already open' }, { status: 409 });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(contractOrderDisputes).values({
        contractOrderId: order.id,
        raisedBy: session.user.id,
        reason: parsed.data.reason,
      });
      await transitionContractOrder(order.id, order.state, 'disputed', {}, tx);
    });
  } catch (err) {
    if (err instanceof InvalidContractTransitionError) {
      return NextResponse.json(
        { error: 'Contract state changed before dispute could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }

  const full = await fetchFullContract(contractId);
  if (!full) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  try {
    await broadcastContract(full.conversationId, 'contract_updated', full);
  } catch (err) {
    console.error(`[contract dispute] broadcast failed for ${contractId}:`, err);
  }

  await notifyContractDisputed(contractId, session.user.id, parsed.data.reason);

  return NextResponse.json({ contract: full });
}
