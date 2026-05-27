import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertAdminAccess } from '@/lib/assertions';

interface RawMessageRow {
  id: string;
  conversation_id: string;
  conversation_kind: 'direct' | 'proposal';
  conversation_label: string | null;
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
  conversation_kind: 'direct' | 'proposal';
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
 * GET /api/admin/disputes/:id/messages — admin-only. Service orders
 * have no FK to a conversation, so this finds every conversation
 * between the order's client/freelancer pair (proposal-linked or
 * direct) and returns the merged message stream, newest first. Each
 * message carries its conversation_id and a human label so the admin
 * can tell which thread it came from.
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

  const orderRows = await sql<
    { order_id: string; client_id: number; freelancer_id: number }[]
  >`
    SELECT
      d.order_id::text  AS order_id,
      o.client_id       AS client_id,
      o.freelancer_id   AS freelancer_id
    FROM service_order_disputes d
    JOIN service_orders o ON o.id = d.order_id
    WHERE d.id = ${disputeId}::uuid
    LIMIT 1
  `;
  const order = orderRows[0];
  if (!order) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  const conversations = await sql<
    {
      id: string;
      kind: 'direct' | 'proposal';
      label: string | null;
    }[]
  >`
    SELECT
      c.id::text AS id,
      CASE WHEN c.proposal_id IS NULL THEN 'direct' ELSE 'proposal' END AS kind,
      j.title AS label
    FROM conversations c
    LEFT JOIN proposals p ON p.id = c.proposal_id
    LEFT JOIN jobs j      ON j.id = p.job_id
    WHERE
      (c.client_id = ${order.client_id} AND c.freelancer_id = ${order.freelancer_id})
      OR (p.freelancer_id = ${order.freelancer_id} AND j.client_id = ${order.client_id})
  `;

  if (conversations.length === 0) {
    return NextResponse.json({ messages: [], conversations: [] });
  }

  const conversationIds = conversations.map((c) => c.id);

  const messages = await sql<RawMessageRow[]>`
    SELECT
      m.id::text              AS id,
      m.conversation_id::text AS conversation_id,
      CASE WHEN c.proposal_id IS NULL THEN 'direct' ELSE 'proposal' END AS conversation_kind,
      j.title                 AS conversation_label,
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
    JOIN conversations c ON c.id = m.conversation_id
    LEFT JOIN proposals p ON p.id = c.proposal_id
    LEFT JOIN jobs j      ON j.id = p.job_id
    JOIN users u          ON u.id = m.sender_id
    WHERE m.conversation_id = ANY(${conversationIds}::uuid[])
    ORDER BY m.sent_at DESC
    LIMIT 500
  `;

  const shaped: ShapedMessage[] = messages.map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    conversation_kind: row.conversation_kind,
    conversation_label: row.conversation_label,
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
    conversations,
  });
}
