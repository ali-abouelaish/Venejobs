import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertAdminAccess } from '@/lib/assertions';

interface RawMessageRow {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  body: string | null;
  message_type: string;
  is_deleted: boolean;
  sent_at: string;
  attachments: unknown;
}

interface ShapedMessage {
  id: string;
  conversation_id: string;
  conversation_kind: 'contract';
  conversation_label: string | null;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  body: string | null;
  message_type: string;
  is_deleted: boolean;
  sent_at: string;
  attachments: unknown[];
}

/**
 * GET /api/admin/contract-disputes/:id/messages — admin-only. Resolves
 * the contract order → contract → conversation, then returns that
 * conversation's messages newest-first. Output shape matches
 * /api/admin/disputes/:id/messages so the admin detail UI can render
 * either flavour with the same component.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await assertAdminAccess(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: disputeId } = await params;

  const ctxRows = await sql<
    {
      conversation_id: string;
      contract_title: string | null;
    }[]
  >`
    SELECT
      c.conversation_id::text AS conversation_id,
      cr.title                AS contract_title
    FROM contract_order_disputes d
    JOIN contract_orders co ON co.id = d.contract_order_id
    JOIN contracts c        ON c.id = co.contract_id
    LEFT JOIN contract_revisions cr ON cr.id = c.current_revision_id
    WHERE d.id = ${disputeId}::uuid
    LIMIT 1
  `;
  const ctx = ctxRows[0];
  if (!ctx) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  const messages = await sql<RawMessageRow[]>`
    SELECT
      m.id::text              AS id,
      m.conversation_id::text AS conversation_id,
      m.sender_id,
      u.name                  AS sender_name,
      u.profile_picture       AS sender_avatar,
      m.body,
      m.message_type,
      m.is_deleted,
      m.sent_at,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id',         a.id,
            'url',        a.url,
            'file_name',  a.file_name,
            'file_type',  a.file_type,
            'mime_type',  a.mime_type,
            'size_bytes', a.size_bytes
          ) ORDER BY a.created_at
        )
        FROM message_attachments a
        WHERE a.message_id = m.id
      ), '[]'::json) AS attachments
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ${ctx.conversation_id}::uuid
    ORDER BY m.sent_at DESC
    LIMIT 500
  `;

  const shaped: ShapedMessage[] = messages.map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    conversation_kind: 'contract',
    conversation_label: ctx.contract_title,
    sender_id: row.sender_id,
    sender_name: row.sender_name,
    sender_avatar: row.sender_avatar,
    body: row.is_deleted ? null : row.body,
    message_type: row.message_type ?? 'text',
    is_deleted: row.is_deleted,
    sent_at: row.sent_at,
    attachments: row.is_deleted ? [] : ((row.attachments as unknown[]) ?? []),
  }));

  return NextResponse.json({
    messages: shaped,
    conversations: [
      {
        id: ctx.conversation_id,
        kind: 'contract',
        label: ctx.contract_title,
      },
    ],
  });
}
