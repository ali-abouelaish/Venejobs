import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { services } from '@/lib/db/schema/services';
import { notifyServiceSubmitted } from '@/lib/email/notifications';

const SUBMITTABLE_STATES = new Set(['draft', 'rejected']);

/** POST /api/services/:id/submit-for-review — transitions draft|rejected → pending_review. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid service id' }, { status: 400 });
  }

  const service = await assertServiceAccess(id, session.user.id);
  if (!service) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!SUBMITTABLE_STATES.has(service.status)) {
    return NextResponse.json(
      { error: `Service in state '${service.status}' cannot be submitted for review` },
      { status: 409 },
    );
  }

  const [row] = await db
    .update(services)
    .set({
      status: 'pending_review',
      rejectionReason: null,
      rejectedAt: null,
      updatedAt: sql`now()`,
    })
    .where(eq(services.id, id))
    .returning();

  await notifyServiceSubmitted(id);

  return NextResponse.json(row);
}
