import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { services } from '@/lib/db/schema/services';

/** GET /api/services/mine — list services owned by the authenticated freelancer. */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Same rating aggregates as /api/services so the freelancer sees their
  // own rating reflected on their dashboard tiles. Scalar correlated
  // subqueries on services.freelancer_id; the (reviewee_id, status) index
  // makes this cheap.
  const rows = await db
    .select({
      id: services.id,
      freelancerId: services.freelancerId,
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
      ratingAvg: sql<string | null>`(
        SELECT avg(rating)::numeric(3,2)
        FROM reviews
        WHERE reviewee_id = ${services.freelancerId} AND status = 'published'
      )`,
      ratingCount: sql<number>`(
        SELECT count(*)::int
        FROM reviews
        WHERE reviewee_id = ${services.freelancerId} AND status = 'published'
      )`,
    })
    .from(services)
    .where(eq(services.freelancerId, session.user.id))
    .orderBy(desc(services.updatedAt));

  return NextResponse.json(rows);
}
