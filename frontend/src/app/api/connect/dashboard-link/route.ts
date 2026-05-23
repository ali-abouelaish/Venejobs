import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getConnectAccount } from '@/lib/connect';

/**
 * POST /api/connect/dashboard-link — creates a short-lived Stripe Express
 * dashboard login link for the authenticated freelancer. Returns 404 if
 * the user has not started Connect onboarding yet (caller should send
 * them to /freelancer/onboarding instead).
 */
export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await getConnectAccount(session.user.id);
  if (!account) {
    return NextResponse.json({ error: 'No Connect account' }, { status: 404 });
  }

  const link = await stripe.accounts.createLoginLink(account.accountId);
  return NextResponse.json({ url: link.url });
}
