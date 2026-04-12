import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!(await assertConversationAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = (await req.json().catch(() => null)) as { message_id?: unknown } | null;
    const messageId = typeof parsed?.message_id === 'string' ? parsed.message_id : '';

    if (!messageId) {
      return NextResponse.json(
        { error: 'message_id is required' },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    const result = await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as typeof sql;

      const cursorRows = await tx<{ sent_at: string }[]>`
        SELECT sent_at
        FROM messages
        WHERE id = ${messageId}::uuid
          AND conversation_id = ${id}::uuid
        LIMIT 1
      `;
      if (cursorRows.length === 0) {
        return { ok: false as const };
      }
      const cursorSentAt = cursorRows[0].sent_at;

      const inserted = await tx<{ message_id: string }[]>`
        INSERT INTO message_reads (message_id, user_id, read_at)
        SELECT m.id, ${userId}, NOW()
        FROM messages m
        WHERE m.conversation_id = ${id}::uuid
          AND m.sent_at <= ${cursorSentAt}::timestamptz
          AND m.sender_id <> ${userId}
          AND m.is_deleted = false
        ON CONFLICT (message_id, user_id) DO NOTHING
        RETURNING message_id
      `;

      return { ok: true as const, marked: inserted.length };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: 'message_id not found in this conversation' },
        { status: 400 },
      );
    }

    return NextResponse.json({ marked_read: result.marked });
  } catch (err) {
    console.error('[POST /api/conversations/[id]/read]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
