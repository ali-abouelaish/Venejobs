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
      return NextResponse.json({ error: 'Proposal already accepted' }, { status: 409 });
    }
    if (proposal.status === 'rejected') {
      return NextResponse.json({ error: 'Proposal is rejected' }, { status: 409 });
    }

    const result = await sql.begin(async (txRaw) => {
      // postgres.js ships a TS definition where TransactionSql = Omit<Sql, ...>,
      // which drops Sql's call signatures. At runtime tx is callable as a
      // template tag exactly like sql. One cast keeps the body clean.
      const tx = txRaw as unknown as typeof sql;

      await tx`
        UPDATE proposals
        SET status = 'accepted', updated_at = NOW()
        WHERE id = ${proposalId}
      `;

      await tx`
        UPDATE proposals
        SET status = 'rejected', updated_at = NOW()
        WHERE job_id = ${proposal.job_id}
          AND id <> ${proposalId}
          AND status = 'pending'
      `;

      const existingConv = await tx<{ id: string }[]>`
        SELECT id FROM conversations WHERE proposal_id = ${proposalId} LIMIT 1
      `;
      let conversationId: string;
      if (existingConv.length > 0) {
        conversationId = existingConv[0].id;
      } else {
        const [inserted] = await tx<{ id: string }[]>`
          INSERT INTO conversations (proposal_id)
          VALUES (${proposalId})
          RETURNING id
        `;
        conversationId = inserted.id;
      }

      const [contract] = await tx<{ id: string }[]>`
        INSERT INTO contracts (conversation_id, created_by, status)
        VALUES (${conversationId}, ${session.user.id}, 'draft')
        RETURNING id
      `;

      return { conversationId, contractId: contract.id };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[POST /api/proposals/[id]/accept]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
