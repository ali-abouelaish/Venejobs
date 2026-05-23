import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getConnectAccount } from '@/lib/connect';

export interface FinanceStripeBalance {
  available: { currency: string; amount: number }[];
  pending: { currency: string; amount: number }[];
}

export interface FinanceStripePayout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: number; // unix seconds
  method: string | null;
  failureMessage: string | null;
}

export interface FinanceStripeResponse {
  accountId: string;
  balance: FinanceStripeBalance;
  payouts: FinanceStripePayout[];
}

/**
 * GET /api/finances/stripe — live Stripe balance + recent payouts for
 * the authenticated freelancer's connected account. Returns null when
 * the user has not started Connect onboarding yet.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const account = await getConnectAccount(session.user.id);
  if (!account) return NextResponse.json(null);

  const stripeAccount = account.accountId;

  const [balance, payouts] = await Promise.all([
    stripe.balance.retrieve(undefined, { stripeAccount }),
    stripe.payouts.list({ limit: 10 }, { stripeAccount }),
  ]);

  const body: FinanceStripeResponse = {
    accountId: stripeAccount,
    balance: {
      available: balance.available.map((b) => ({ currency: b.currency, amount: b.amount })),
      pending: balance.pending.map((b) => ({ currency: b.currency, amount: b.amount })),
    },
    payouts: payouts.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      arrivalDate: p.arrival_date,
      method: p.method ?? null,
      failureMessage: p.failure_message ?? null,
    })),
  };

  return NextResponse.json(body);
}
