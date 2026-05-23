import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asc, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { assertServiceAccess } from '@/lib/assertions';
import { db } from '@/lib/db/drizzle';
import { services, serviceAddons } from '@/lib/db/schema/services';
import { users } from '@/lib/db/schema';

/**
 * GET /api/services/:id — service detail with addons.
 * Public for status='published'. Owner can also see their own non-published
 * services (drafts, pending_review, rejected). Other states return 404 to
 * non-owners to avoid leaking existence.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid service id' }, { status: 400 });
  }

  const session = await auth();

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
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
      freelancerName: users.name,
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
    .innerJoin(users, eq(users.id, services.freelancerId))
    .where(eq(services.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const service = rows[0];

  const isOwner = session?.user.id === service.freelancerId;
  if (service.status !== 'published' && !isOwner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const addons = await db
    .select()
    .from(serviceAddons)
    .where(eq(serviceAddons.serviceId, id))
    .orderBy(asc(serviceAddons.sortOrder), asc(serviceAddons.createdAt));

  return NextResponse.json({ ...service, addons });
}

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  basePrice: z.number().int().positive().optional(),
  deliveryDays: z.number().int().min(1).max(30).optional(),
  baseRevisions: z.number().int().min(0).max(10).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  galleryImageUrls: z.array(z.string().url()).max(10).optional(),
});

const EDITABLE_STATES = new Set(['draft', 'rejected']);

/** PATCH /api/services/:id — edit a service. Allowed only in 'draft' or 'rejected'. */
export async function PATCH(
  req: NextRequest,
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
  if (!EDITABLE_STATES.has(service.status)) {
    return NextResponse.json(
      { error: `Service in state '${service.status}' cannot be edited` },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [row] = await db
    .update(services)
    .set({ ...parsed.data, updatedAt: sql`now()` })
    .where(eq(services.id, id))
    .returning();

  return NextResponse.json(row);
}
