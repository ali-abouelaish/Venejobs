import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import { assertConversationAccess } from '@/lib/assertions';
import { fetchFullContract, type Contract } from '@/lib/contracts';
import { broadcastToWs } from '@/lib/ws';

type Params = { params: Promise<{ id: string }> };

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

interface AttachmentInput {
  url?: unknown;
  file_name?: unknown;
  file_type?: unknown;
  mime_type?: unknown;
  size_bytes?: unknown;
}

interface PostBody {
  body?: unknown;
  reply_to_id?: unknown;
  attachments?: unknown;
}

interface RawMessageRow {
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
  reply_body: string | null;
  reply_is_deleted: boolean | null;
  reply_sender_id: number | null;
  reply_sender_name: string | null;
  attachments: unknown;
  reactions: unknown;
  read_by: number[];
}

interface ShapedMessage {
  id: string;
  conversation_id: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string | null;
  body: string | null;
  message_type: string;
  is_deleted: boolean;
  reply_to_id: string | null;
  reply_to: {
    id: string;
    body: string | null;
    sender_id: number | null;
    sender_name: string;
  } | null;
  sent_at: string;
  attachments: unknown[];
  reactions: unknown[];
  read_by: number[];
  contract?: Contract;
}

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!(await assertConversationAccess(id, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const before = url.searchParams.get('before');
    const limitParam = parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    let beforeSentAt: string | null = null;
    if (before) {
      const cursorRows = await sql<{ sent_at: string }[]>`
        SELECT sent_at
        FROM messages
        WHERE id = ${before}::uuid
          AND conversation_id = ${id}::uuid
        LIMIT 1
      `;
      if (cursorRows.length === 0) {
        return NextResponse.json({ error: 'Invalid before cursor' }, { status: 400 });
      }
      beforeSentAt = cursorRows[0].sent_at;
    }

    const rows = await sql<RawMessageRow[]>`
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
        u.profile_picture AS sender_avatar,
        rm.body           AS reply_body,
        rm.is_deleted     AS reply_is_deleted,
        rm.sender_id      AS reply_sender_id,
        ru.name           AS reply_sender_name,
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
        ), '[]'::json) AS attachments,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'emoji',   r.emoji,
              'count',   r.cnt,
              'userIds', r.user_ids
            )
          )
          FROM (
            SELECT emoji, COUNT(*)::int AS cnt, array_agg(user_id) AS user_ids
            FROM message_reactions
            WHERE message_id = m.id
            GROUP BY emoji
          ) r
        ), '[]'::json) AS reactions,
        COALESCE((
          SELECT array_agg(mr.user_id)
          FROM message_reads mr
          WHERE mr.message_id = m.id
        ), '{}'::int[]) AS read_by
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN messages rm ON rm.id = m.reply_to_id
      LEFT JOIN users ru ON ru.id = rm.sender_id
      WHERE m.conversation_id = ${id}::uuid
        AND (
          ${beforeSentAt}::timestamptz IS NULL
          OR m.sent_at < ${beforeSentAt}::timestamptz
        )
      ORDER BY m.sent_at DESC
      LIMIT ${limit}
    `;

    const shaped = rows.map(shapeMessage);
    const messages = await Promise.all(shaped.map(hydrateContract));

    const nextCursor = rows.length === limit ? (rows[rows.length - 1]?.id ?? null) : null;

    return NextResponse.json({ messages, nextCursor });
  } catch (err) {
    console.error('[GET /api/conversations/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    if (!(await assertConversationAccess(conversationId, session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = (await req.json().catch(() => null)) as PostBody | null;
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const trimmedBody = typeof parsed.body === 'string' ? parsed.body.trim() : '';
    const replyToId =
      typeof parsed.reply_to_id === 'string' && parsed.reply_to_id.length > 0
        ? parsed.reply_to_id
        : null;

    const rawAttachments: AttachmentInput[] = Array.isArray(parsed.attachments)
      ? (parsed.attachments as AttachmentInput[])
      : [];

    const attachments: Array<{
      url: string;
      fileName: string;
      fileType: string;
      mimeType: string;
      sizeBytes: number;
    }> = [];

    for (const a of rawAttachments) {
      const url = typeof a?.url === 'string' ? a.url : null;
      const fileName = typeof a?.file_name === 'string' ? a.file_name : null;
      const fileType = typeof a?.file_type === 'string' ? a.file_type : null;
      const mimeType = typeof a?.mime_type === 'string' ? a.mime_type : null;
      const sizeBytes = typeof a?.size_bytes === 'number' ? a.size_bytes : null;
      if (!url || !fileName || !fileType || !mimeType || sizeBytes === null) {
        return NextResponse.json(
          { error: 'Invalid attachment shape' },
          { status: 400 },
        );
      }
      attachments.push({ url, fileName, fileType, mimeType, sizeBytes });
    }

    if (!trimmedBody && attachments.length === 0) {
      return NextResponse.json(
        { error: 'Message must have a body or at least one attachment' },
        { status: 400 },
      );
    }

    if (replyToId) {
      const replyRows = await sql<{ id: string }[]>`
        SELECT id::text
        FROM messages
        WHERE id = ${replyToId}::uuid
          AND conversation_id = ${conversationId}::uuid
        LIMIT 1
      `;
      if (replyRows.length === 0) {
        return NextResponse.json(
          { error: 'reply_to_id does not belong to this conversation' },
          { status: 400 },
        );
      }
    }

    const senderId = session.user.id;

    const newId = await sql.begin(async (txRaw) => {
      const tx = txRaw as unknown as typeof sql;

      const [msg] = await tx<{ id: string }[]>`
        INSERT INTO messages (conversation_id, sender_id, body, reply_to_id, message_type)
        VALUES (
          ${conversationId}::uuid,
          ${senderId},
          ${trimmedBody},
          ${replyToId}::uuid,
          'text'
        )
        RETURNING id::text
      `;

      for (const a of attachments) {
        await tx`
          INSERT INTO message_attachments (message_id, url, file_name, file_type, mime_type, size_bytes)
          VALUES (
            ${msg.id}::uuid,
            ${a.url},
            ${a.fileName},
            ${a.fileType},
            ${a.mimeType},
            ${a.sizeBytes}
          )
        `;
      }

      return msg.id;
    });

    const fullMessage = await fetchFullMessage(newId);
    if (!fullMessage) {
      return NextResponse.json({ error: 'Insert succeeded but fetch failed' }, { status: 500 });
    }

    await broadcastToWs(conversationId, { type: 'new_message', message: fullMessage });

    return NextResponse.json({ message: fullMessage }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/conversations/[id]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchFullMessage(messageId: string): Promise<ShapedMessage | null> {
  const rows = await sql<RawMessageRow[]>`
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
      u.profile_picture AS sender_avatar,
      rm.body           AS reply_body,
      rm.is_deleted     AS reply_is_deleted,
      rm.sender_id      AS reply_sender_id,
      ru.name           AS reply_sender_name,
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
      ), '[]'::json) AS attachments,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'emoji',   r.emoji,
            'count',   r.cnt,
            'userIds', r.user_ids
          )
        )
        FROM (
          SELECT emoji, COUNT(*)::int AS cnt, array_agg(user_id) AS user_ids
          FROM message_reactions
          WHERE message_id = m.id
          GROUP BY emoji
        ) r
      ), '[]'::json) AS reactions,
      COALESCE((
        SELECT array_agg(mr.user_id)
        FROM message_reads mr
        WHERE mr.message_id = m.id
      ), '{}'::int[]) AS read_by
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    LEFT JOIN messages rm ON rm.id = m.reply_to_id
    LEFT JOIN users ru ON ru.id = rm.sender_id
    WHERE m.id = ${messageId}::uuid
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return hydrateContract(shapeMessage(rows[0]));
}

function shapeMessage(row: RawMessageRow): ShapedMessage {
  const isDeleted = row.is_deleted;
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_name: row.sender_name,
    sender_avatar: row.sender_avatar,
    body: isDeleted ? null : row.body,
    message_type: row.message_type ?? 'text',
    is_deleted: isDeleted,
    reply_to_id: row.reply_to_id,
    reply_to: row.reply_to_id
      ? {
          id: row.reply_to_id,
          body: row.reply_is_deleted ? null : row.reply_body,
          sender_id: row.reply_sender_id,
          sender_name: row.reply_sender_name ?? '',
        }
      : null,
    sent_at: row.sent_at,
    attachments: isDeleted ? [] : ((row.attachments as unknown[]) ?? []),
    reactions: (row.reactions as unknown[]) ?? [],
    read_by: row.read_by ?? [],
  };
}

async function hydrateContract(msg: ShapedMessage): Promise<ShapedMessage> {
  if (msg.is_deleted) return msg;
  if (msg.message_type !== 'contract') return msg;
  const contractRows = await sql<{ id: string }[]>`
    SELECT id::text FROM contracts WHERE message_id = ${msg.id}::uuid LIMIT 1
  `;
  if (contractRows.length === 0) return msg;
  const contract = await fetchFullContract(contractRows[0].id);
  return contract ? { ...msg, contract } : msg;
}
