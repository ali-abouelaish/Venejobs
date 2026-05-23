import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrCreateConnectAccount } from '@/lib/connect';

/**
 * POST /api/connect/account — ensure the authenticated freelancer has a
 * Stripe Connect account and a row in stripe_connect_accounts. Idempotent.
 * Returns the persisted row.
 */
export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const row = await getOrCreateConnectAccount(session.user.id);
  return NextResponse.json(row);
}
