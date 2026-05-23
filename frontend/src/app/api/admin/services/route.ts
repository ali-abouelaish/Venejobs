import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertAdminAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { services } from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

const VALID_STATUSES = new Set([
  'draft',
  'pending_review',
  'published',
  'paused',
  'rejected',
]);

/**
 * GET /api/admin/services?status=<status> — admin-only listing.
 * Defaults to status=pending_review for the review queue.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') ?? 'pending_review';
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const conditions: SQL[] = [eq(services.status, status)];

  const rows = await db
    .select({
      id: services.id,
      title: services.title,
      description: services.description,
      category: services.category,
      basePrice: services.basePrice,
      currency: services.currency,
      deliveryDays: services.deliveryDays,
      baseRevisions: services.baseRevisions,
      coverImageUrl: services.coverImageUrl,
      galleryImageUrls: services.galleryImageUrls,
      status: services.status,
      rejectionReason: services.rejectionReason,
      rejectedAt: services.rejectedAt,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
      freelancerId: services.freelancerId,
      freelancerName: users.name,
      freelancerEmail: users.email,
    })
    .from(services)
    .innerJoin(users, eq(users.id, services.freelancerId))
    .where(and(...conditions))
    .orderBy(desc(services.updatedAt));

  return NextResponse.json(rows);
}
