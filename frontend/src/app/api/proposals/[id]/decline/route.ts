import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertProposalClientAccess } from '@/lib/assertions';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const proposalId = Number(idParam);
    if (!Number.isFinite(proposalId)) {
      return NextResponse.json({ error: 'Invalid proposal id' }, { status: 400 });
    }

    const proposal = await assertProposalClientAccess(proposalId, session.user.id);
    if (!proposal) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (proposal.status === 'accepted') {
      return NextResponse.json({ error: 'Cannot decline an accepted proposal' }, { status: 409 });
    }
    if (proposal.status === 'rejected') {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await sql`
      UPDATE proposals
      SET status = 'rejected', updated_at = NOW()
      WHERE id = ${proposalId}
    `;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/proposals/[id]/decline]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
