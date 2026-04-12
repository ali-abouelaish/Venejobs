import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, broadcastContract } from '@/lib/contracts';
import { broadcastToWs } from '@/lib/ws';

/** POST /api/contracts/[contractId]/submit */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contractId } = await params;
  const userId = session.user.id;

  const contracts = await sql<{
    id: string;
    conversation_id: string;
    status: string;
    current_revision_id: string | null;
  }[]>`
    SELECT id::text, conversation_id::text, status::text, current_revision_id::text
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

  if (contract.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft contracts can be submitted' },
      { status: 409 },
    );
  }

  if (!contract.current_revision_id) {
    return NextResponse.json({ error: 'Contract has no content' }, { status: 400 });
  }

  const newMessageId = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as typeof sql;

    const [msg] = await tx<{ id: string }[]>`
      INSERT INTO messages (conversation_id, sender_id, body, message_type)
      VALUES (${contract.conversation_id}::uuid, ${userId}, '', 'contract')
      RETURNING id::text
    `;

    await tx`
      UPDATE contracts
      SET status = 'pending_review',
          message_id = ${msg.id}::uuid,
          updated_at = now()
      WHERE id = ${contractId}::uuid
    `;

    return msg.id;
  });

  const fullContract = await fetchFullContract(contractId);
  if (!fullContract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  const messageRows = await sql<{
    id: string;
    conversation_id: string;
    sender_id: number;
    body: string | null;
    message_type: string;
    is_deleted: boolean;
    reply_to_id: string | null;
    sent_at: string;
    sender_name: string;
    sender_avatar: string | null;
  }[]>`
    SELECT
      m.id::text,
      m.conversation_id::text,
      m.sender_id,
      m.body,
      m.message_type,
      m.is_deleted,
      m.reply_to_id::text,
      m.sent_at,
      u.name            AS sender_name,
      u.profile_picture AS sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${newMessageId as unknown as string}::uuid
    LIMIT 1
  `;

  if (messageRows.length > 0) {
    const row = messageRows[0];
    const payload = {
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      sender_name: row.sender_name,
      sender_avatar: row.sender_avatar,
      body: row.body,
      message_type: row.message_type,
      is_deleted: row.is_deleted,
      reply_to_id: row.reply_to_id,
      reply_to: null,
      sent_at: row.sent_at,
      attachments: [] as unknown[],
      reactions: [] as unknown[],
      read_by: [] as number[],
      contract: fullContract,
    };
    await broadcastToWs(contract.conversation_id, {
      type: 'new_message',
      message: payload,
    });
  }

  await broadcastContract(contract.conversation_id, 'contract_updated', fullContract);

  return NextResponse.json({ contract: fullContract });
}
