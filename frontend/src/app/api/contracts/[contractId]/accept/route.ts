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
import {
  TransferError,
  createTransferForContractOrder,
} from '@/lib/transfers';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

/**
 * POST /api/contracts/[contractId]/accept — client accepts delivery and
 * releases the contract payment to the freelancer's Connect account.
 *
 * 1. Transitions delivered → accepted (sets accepted_at = now()).
 * 2. Creates a Stripe Transfer for the net payout; persists transfer_id.
 * 3. State moves to 'completed' later via the transfer.* webhook.
 *
 * Stripe idempotency key derived from contract_order_id + accepted_at so
 * retries (e.g. after a transient network blip between transition and
 * transfer) return the same transfer rather than creating duplicates.
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

  if (session.user.id !== order.clientId) {
    return NextResponse.json(
      { error: 'Only the client can accept this contract' },
      { status: 403 },
    );
  }

  if (order.state !== 'delivered') {
    return NextResponse.json(
      { error: `Contract order in state '${order.state}' cannot be accepted` },
      { status: 409 },
    );
  }

  let accepted;
  try {
    accepted = await transitionContractOrder(order.id, 'delivered', 'accepted', {
      acceptedAt: sql`now()`,
    });
  } catch (err) {
    if (err instanceof InvalidContractTransitionError) {
      return NextResponse.json(
        { error: 'Contract state changed before acceptance could be recorded' },
        { status: 409 },
      );
    }
    throw err;
  }

  try {
    await createTransferForContractOrder(accepted);

    const full = await fetchFullContract(contractId);
    if (!full) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    try {
      await broadcastContract(full.conversationId, 'contract_updated', full);
    } catch (err) {
      console.error(`[contract accept] broadcast failed for ${contractId}:`, err);
    }

    return NextResponse.json({ contract: full });
  } catch (err) {
    if (err instanceof TransferError) {
      // Order is in 'accepted' with no transfer_id. Operations can replay
      // via the cron auto-accept path's idempotent transfer call.
      console.error(`[contract accept] transfer failed for ${order.id}:`, err);
      return NextResponse.json(
        {
          error: 'Acceptance recorded but transfer creation failed',
          code: 'transfer_failed',
          message: err.message,
        },
        { status: 502 },
      );
    }
    throw err;
  }
}
