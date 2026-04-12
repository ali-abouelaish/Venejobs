import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { broadcastToWs } from '@/lib/ws';

type Params = { params: Promise<{ id: string; messageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;

    if (!(await assertConversationAccess(conversationId, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [row] = await sql<{ sender_id: number }[]>`
      SELECT sender_id
      FROM messages
      WHERE id = ${messageId}::uuid
        AND conversation_id = ${conversationId}::uuid
      LIMIT 1
    `;

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (row.sender_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      UPDATE messages
      SET is_deleted = true
      WHERE id = ${messageId}::uuid
    `;

    await broadcastToWs(conversationId, {
      type: 'message_deleted',
      messageId,
      conversationId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/conversations/[id]/messages/[messageId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
