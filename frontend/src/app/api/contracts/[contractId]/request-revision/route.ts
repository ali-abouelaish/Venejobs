import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

/** POST /api/contracts/[contractId]/request-revision */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await req.text();
  if (raw.trim().length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      Object.keys(parsed as Record<string, unknown>).length > 0
    ) {
      return NextResponse.json({ error: 'Unknown fields not allowed' }, { status: 400 });
    }
  }

  const { contractId } = await params;
  const userId = session.user.id;

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
      { error: 'Contract is not in a reviewable state' },
      { status: 409 },
    );
  }

  await sql`
    UPDATE contracts
    SET status = 'revision_requested', updated_at = now()
    WHERE id = ${contractId}::uuid
  `;

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 500 });
  }

  await broadcastContract(contract.conversation_id, 'contract_updated', fullContract);

  return NextResponse.json({ contract: fullContract });
}
