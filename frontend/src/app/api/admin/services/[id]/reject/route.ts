import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { services } from '@/lib/db/schema/services';
import { notifyServiceRejected } from '@/lib/email/notifications';

const RejectSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

/** POST /api/admin/services/:id/reject — pending_review → rejected, persists reason + rejected_at. */
export async function POST(
  req: NextRequest,
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

  const body = await req.json().catch(() => null);
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: services.id, status: services.status })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (existing[0].status !== 'pending_review') {
    return NextResponse.json(
      { error: `Service in state '${existing[0].status}' cannot be rejected` },
      { status: 409 },
    );
  }

  const [row] = await db
    .update(services)
    .set({
      status: 'rejected',
      rejectionReason: parsed.data.reason,
      rejectedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(services.id, id))
    .returning();

  await notifyServiceRejected(id, parsed.data.reason);

  return NextResponse.json(row);
}
