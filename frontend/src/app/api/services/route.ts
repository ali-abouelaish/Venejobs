import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq, gte, lte, ilike, or, sql, type SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { services } from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

// Correlated subqueries over the published reviews of the service's
// freelancer. The `reviews_reviewee_status_idx` index covers the
// (reviewee_id, status) filter so this stays cheap even on large lists.
const ratingAvgSql = sql<string | null>`(
  SELECT avg(rating)::numeric(3,2)
  FROM reviews
  WHERE reviewee_id = ${services.freelancerId} AND status = 'published'
)`;
const ratingCountSql = sql<number>`(
  SELECT count(*)::int
  FROM reviews
  WHERE reviewee_id = ${services.freelancerId} AND status = 'published'
)`;

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(1).max(50),
  basePrice: z.number().int().positive(),
  deliveryDays: z.number().int().min(1).max(30),
  baseRevisions: z.number().int().min(0).max(10).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  galleryImageUrls: z.array(z.string().url()).max(10).optional(),
});

const BrowseSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  maxDeliveryDays: z.coerce.number().int().positive().max(30).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * GET /api/services — public browse of published services.
 * Filters: q (ILIKE on title/description/category), category, minPrice,
 * maxPrice, maxDeliveryDays. Paginated.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const parsed = BrowseSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const q = parsed.data;

  const conditions: SQL[] = [eq(services.status, 'published')];
  if (q.q) {
    const pattern = `%${q.q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    const term = or(
      ilike(services.title, pattern),
      ilike(services.description, pattern),
      ilike(services.category, pattern),
    );
    if (term) conditions.push(term);
  }
  if (q.category) conditions.push(eq(services.category, q.category));
  if (q.minPrice != null) conditions.push(gte(services.basePrice, q.minPrice));
  if (q.maxPrice != null) conditions.push(lte(services.basePrice, q.maxPrice));
  if (q.maxDeliveryDays != null) conditions.push(lte(services.deliveryDays, q.maxDeliveryDays));

  const items = await db
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
      createdAt: services.createdAt,
      freelancerId: services.freelancerId,
      freelancerName: users.name,
      ratingAvg: ratingAvgSql,
      ratingCount: ratingCountSql,
    })
    .from(services)
    .innerJoin(users, eq(users.id, services.freelancerId))
    .where(and(...conditions))
    .orderBy(desc(services.createdAt))
    .limit(q.limit)
    .offset(q.offset);

  return NextResponse.json({ items, limit: q.limit, offset: q.offset });
}

/** POST /api/services — create a new service in 'draft' status. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(services)
    .values({
      freelancerId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      basePrice: parsed.data.basePrice,
      deliveryDays: parsed.data.deliveryDays,
      baseRevisions: parsed.data.baseRevisions ?? 0,
      coverImageUrl: parsed.data.coverImageUrl ?? null,
      galleryImageUrls: parsed.data.galleryImageUrls ?? [],
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
