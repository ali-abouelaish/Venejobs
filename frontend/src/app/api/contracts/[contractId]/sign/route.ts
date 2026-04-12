import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';

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
    }
  });

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  await broadcastContract(contract.conversation_id, 'contract_updated', fullContract);

  return NextResponse.json({ contract: fullContract });
}
