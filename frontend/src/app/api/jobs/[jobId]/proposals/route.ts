import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertJobOwnership } from '@/lib/assertions';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId: jobIdParam } = await params;
    const jobId = Number(jobIdParam);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 });
    }

    const job = await assertJobOwnership(jobId, session.user.id);
    if (!job) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const proposals = await sql`
      SELECT
        p.id,
        p.cover_letter,
        p.proposed_amount      AS offered_price,
        p.estimated_duration   AS estimated_days,
        p.status,
        p.created_at,
        u.name        AS freelancer_name,
        u.profile_picture AS avatar_url,
        c.id          AS conversation_id
      FROM proposals p
      JOIN users u ON u.id = p.freelancer_id
      LEFT JOIN conversations c ON c.proposal_id = p.id
      WHERE p.job_id = ${jobId}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({ proposals });
  } catch (err) {
    console.error('[GET /api/jobs/[jobId]/proposals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
