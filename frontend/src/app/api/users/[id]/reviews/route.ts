import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { reviews } from '@/lib/db/schema/reviews';

const PAGE_SIZE = 10;

interface Cursor {
  publishedAt: string;
  id: string;
}

// Compound cursor on (published_at, id) so ties (both reviews on the same
// order publish in the same transaction and share published_at) paginate
// deterministically.
function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(s: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    if (
      typeof parsed?.publishedAt !== 'string' ||
      typeof parsed?.id !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * GET /api/users/:id/reviews — public, paginated. Returns only
 * status='published' reviews for the given user as reviewee, plus the
 * aggregate (rating_avg, rating_count). Pending reviews never surface
 * here.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: idParam } = await params;
  const userId = Number(idParam);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const cursorParam = req.nextUrl.searchParams.get('cursor');
  let cursor: Cursor | null = null;
  if (cursorParam) {
    cursor = decodeCursor(cursorParam);
    if (!cursor) {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
    }
  }

  const rows = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.revieweeId, userId),
        eq(reviews.status, 'published'),
        cursor
          ? sql`(${reviews.publishedAt}, ${reviews.id}) < (${cursor.publishedAt}::timestamptz, ${cursor.id}::uuid)`
          : undefined,
      ),
    )
    .orderBy(desc(reviews.publishedAt), desc(reviews.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last && last.publishedAt
      ? encodeCursor({ publishedAt: last.publishedAt, id: last.id })
      : null;

  const [agg] = await db
    .select({
      avg: sql<string | null>`avg(${reviews.rating})::numeric(3,2)`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(
      and(eq(reviews.revieweeId, userId), eq(reviews.status, 'published')),
    );

  return NextResponse.json({
    reviews: page,
    rating_avg: agg?.avg ? Number(agg.avg) : 0,
    rating_count: agg?.count ?? 0,
    nextCursor,
  });
}
