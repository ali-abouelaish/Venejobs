import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConnectAccount, syncConnectAccount } from '@/lib/connect';

/**
 * GET /api/connect/status — live-syncs the authenticated freelancer's
 * Connect account state from Stripe and returns the refreshed row.
 * Returns null when the freelancer has not started onboarding yet.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await getConnectAccount(session.user.id);
  if (!existing) return NextResponse.json(null);

  const synced = await syncConnectAccount(session.user.id);
  return NextResponse.json(synced);
}
