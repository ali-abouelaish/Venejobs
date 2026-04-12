import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const url = new URL(req.url);
    const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limitParam = parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
    const page = Math.max(Number.isFinite(pageParam) ? pageParam : 1, 1);
    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = (page - 1) * limit;

    const inbox = await sql`
      SELECT
        c.id                  AS conversation_id,
        p.id                  AS proposal_id,
        p.status              AS proposal_status,
        p.proposed_amount     AS offered_price,
        j.title               AS job_title,
        json_build_object(
          'id',
            CASE WHEN p.freelancer_id = ${userId} THEN client.id     ELSE freelancer.id     END,
          'name',
            CASE WHEN p.freelancer_id = ${userId} THEN client.name   ELSE freelancer.name   END,
          'avatar',
            CASE WHEN p.freelancer_id = ${userId} THEN client.profile_picture ELSE freelancer.profile_picture END
        )                     AS other_participant,
        CASE
          WHEN last_msg.sent_at IS NULL THEN NULL
          ELSE json_build_object(
            'body',      CASE WHEN last_msg.is_deleted THEN NULL ELSE last_msg.body END,
            'sent_at',   last_msg.sent_at,
            'sender_id', last_msg.sender_id
          )
        END                   AS last_message,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id <> ${userId}
            AND m.is_deleted = false
            AND NOT EXISTS (
              SELECT 1 FROM message_reads mr
              WHERE mr.message_id = m.id AND mr.user_id = ${userId}
            )
        )                     AS unread_count
      FROM conversations c
      JOIN proposals p      ON p.id  = c.proposal_id
      JOIN jobs j           ON j.id  = p.job_id
      JOIN users freelancer ON freelancer.id = p.freelancer_id
      JOIN users client     ON client.id     = j.client_id
      LEFT JOIN LATERAL (
        SELECT body, sent_at, is_deleted, sender_id
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY sent_at DESC
        LIMIT 1
      ) last_msg ON true
      WHERE p.freelancer_id = ${userId}
         OR j.client_id     = ${userId}
      ORDER BY COALESCE(last_msg.sent_at, c.created_at) DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json({ inbox, page, limit });
  } catch (err) {
    console.error('[GET /api/inbox]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
