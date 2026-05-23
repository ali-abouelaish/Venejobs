import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { assertConnectReady } from '@/lib/connect';
import { db } from '@/lib/db/drizzle';
import { services } from '@/lib/db/schema/services';
import { notifyServiceApproved } from '@/lib/email/notifications';

/**
 * POST /api/admin/services/:id/approve — pending_review → published.
 * Gated by a LIVE Stripe Connect onboarding check on the freelancer.
 * The check both verifies and refreshes the cached row in
 * stripe_connect_accounts — never trust a stale cached flag.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid service id' }, { status: 400 });
  }

  const existing = await db
    .select({
      id: services.id,
      status: services.status,
      freelancerId: services.freelancerId,
    })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (existing[0].status !== 'pending_review') {
    return NextResponse.json(
      { error: `Service in state '${existing[0].status}' cannot be approved` },
      { status: 409 },
    );
  }

  const readiness = await assertConnectReady(existing[0].freelancerId);
  if (!readiness.ok) {
    if (readiness.reason === 'no_account') {
      return NextResponse.json(
        {
          error: 'Freelancer has no Stripe Connect account',
          code: 'connect_missing',
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      {
        error: 'Freelancer Connect onboarding incomplete',
        code: 'connect_not_ready',
        details: {
          chargesEnabled: readiness.account.chargesEnabled,
          payoutsEnabled: readiness.account.payoutsEnabled,
          detailsSubmitted: readiness.account.detailsSubmitted,
          currentlyDue: readiness.account.requirementsCurrentlyDue,
        },
      },
      { status: 422 },
    );
  }

  const [row] = await db
    .update(services)
    .set({
      status: 'published',
      rejectionReason: null,
      rejectedAt: null,
      updatedAt: sql`now()`,
    })
    .where(eq(services.id, id))
    .returning();

  await notifyServiceApproved(id);

  return NextResponse.json(row);
}
