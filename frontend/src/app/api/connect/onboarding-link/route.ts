import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getOrCreateConnectAccount } from '@/lib/connect';

/**
 * POST /api/connect/onboarding-link — generate a Stripe-hosted onboarding
 * link for the authenticated freelancer. Ensures a Connect account exists
 * first. Account-links are one-time-use and expire quickly.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await getOrCreateConnectAccount(session.user.id);

  const origin = req.nextUrl.origin;
  const link = await stripe.accountLinks.create({
    account: account.accountId,
    refresh_url: `${origin}/freelancer/onboarding?refresh=1`,
    return_url: `${origin}/freelancer/onboarding?return=1`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url, expiresAt: link.expires_at });
}
