import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';
import { broadcastToWs } from '@/lib/ws';

interface SignBody {
  typedName: string;
}

/** POST /api/contracts/[contractId]/sign */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  const userId = session.user.id;

  let body: SignBody;
  try {
    body = (await req.json()) as SignBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { typedName } = body;
  if (!typedName?.trim()) {
    return NextResponse.json({ error: 'Typed name is required' }, { status: 400 });
  }

  const users = await sql<{ name: string }[]>`
    SELECT name FROM users WHERE id = ${userId}
  `;
  if (users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (users[0].name.trim().toLowerCase() !== typedName.trim().toLowerCase()) {
    return NextResponse.json(
      { error: 'Typed name must match your profile name' },
      { status: 400 },
    );
  }

  const contracts = await sql<{
    id: string;
    conversation_id: string;
    status: string;
  }[]>`
    SELECT id::text, conversation_id::text, status::text
    FROM contracts
    WHERE id = ${contractId}::uuid
  `;
  if (contracts.length === 0) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }
  const contract = contracts[0];

  if (!(await assertConversationAccess(contract.conversation_id, userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (contract.status !== 'pending_review') {
    return NextResponse.json(
      { error: 'Contract is not in a signable state' },
      { status: 409 },
    );
  }

  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;
  const userAgent = req.headers.get('user-agent') ?? null;

  await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as typeof sql;

    await tx`
      INSERT INTO contract_signatures (contract_id, user_id, typed_name, ip_address, user_agent)
      VALUES (${contractId}::uuid, ${userId}, ${typedName.trim()}, ${ipAddress}, ${userAgent})
      ON CONFLICT (contract_id, user_id) DO NOTHING
    `;

    const sigCount = await tx<{ count: number }[]>`
      SELECT COUNT(DISTINCT user_id)::int AS count
      FROM contract_signatures
      WHERE contract_id = ${contractId}::uuid
    `;

    if ((sigCount[0]?.count ?? 0) >= 2) {
      await tx`
        UPDATE contracts
        SET status = 'accepted', updated_at = now()
        WHERE id = ${contractId}::uuid
      `;
      await tx`
        UPDATE proposals
        SET status = 'accepted', updated_at = now()
        WHERE id = (
          SELECT p.id FROM proposals p
          JOIN conversations c ON c.proposal_id = p.id
          WHERE c.id = ${contract.conversation_id}::uuid
          LIMIT 1
        )
      `;

      // Auto-fill: check if job has reached hire_count accepted contracts
      const [jobRow] = await tx<{ job_id: number; hire_count: number; job_status: string }[]>`
        SELECT j.id AS job_id, j.hire_count, j.status::text AS job_status
        FROM contracts c
        JOIN conversations conv ON conv.id = c.conversation_id
        JOIN proposals p ON p.id = conv.proposal_id
        JOIN jobs j ON j.id = p.job_id
        WHERE c.id = ${contractId}::uuid
      `;

      if (jobRow) {
        const [{ accepted_count }] = await tx<{ accepted_count: number }[]>`
          SELECT COUNT(DISTINCT c2.id)::int AS accepted_count
          FROM contracts c2
          JOIN conversations conv2 ON conv2.id = c2.conversation_id
          JOIN proposals p2 ON p2.id = conv2.proposal_id
          WHERE p2.job_id = ${jobRow.job_id} AND c2.status = 'accepted'
        `;

        if (accepted_count >= jobRow.hire_count && jobRow.job_status !== 'filled') {
          await tx`
            UPDATE jobs SET status = 'filled', updated_at = NOW()
            WHERE id = ${jobRow.job_id}
          `;
          await tx`
            UPDATE proposals SET status = 'rejected', updated_at = NOW()
            WHERE job_id = ${jobRow.job_id} AND status = 'pending'
          `;
        }
      }
    }
  });

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  await broadcastContract(contract.conversation_id, 'contract_updated', fullContract);

  // If contract is now accepted, broadcast job_filled to current conversation
  // TODO: broadcast to every conversation linked to a now-rejected proposal
  if (fullContract.status === 'accepted') {
    const [jobCheck] = await sql<{ job_id: number; job_status: string }[]>`
      SELECT j.id AS job_id, j.status::text AS job_status
      FROM contracts c
      JOIN conversations conv ON conv.id = c.conversation_id
      JOIN proposals p ON p.id = conv.proposal_id
      JOIN jobs j ON j.id = p.job_id
      WHERE c.id = ${contractId}::uuid
    `;
    if (jobCheck?.job_status === 'filled') {
      await broadcastToWs(contract.conversation_id, {
        type: 'job_filled',
        jobId: jobCheck.job_id,
        conversationId: contract.conversation_id,
      });
    }
  }

  return NextResponse.json({ contract: fullContract });
}
