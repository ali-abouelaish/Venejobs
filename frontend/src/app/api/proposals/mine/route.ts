import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const pageRaw = Number(url.searchParams.get('page') ?? '1');
    const limitRaw = Number(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT));

    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const limit =
      Number.isFinite(limitRaw) && limitRaw >= 1
        ? Math.min(Math.floor(limitRaw), MAX_LIMIT)
        : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const proposals = await sql`
      SELECT
        p.id,
        p.job_id,
        p.cover_letter,
        p.proposed_amount    AS offered_price,
        p.estimated_duration AS estimated_days,
        p.status,
        p.created_at,
        p.updated_at,
        j.title              AS job_title,
        j.status             AS job_status,
        c.id                 AS conversation_id
      FROM proposals p
      JOIN jobs j ON j.id = p.job_id
      LEFT JOIN conversations c ON c.proposal_id = p.id
      WHERE p.freelancer_id = ${session.user.id}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const totalRows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM proposals
      WHERE freelancer_id = ${session.user.id}
    `;
    const total = Number(totalRows[0]?.count ?? '0');

    return NextResponse.json({ proposals, page, limit, total });
  } catch (err) {
    console.error('[GET /api/proposals/mine]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
