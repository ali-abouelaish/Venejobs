import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

/**
 * POST /api/conversations/direct
 * Body: { freelancerId: number }
 *
 * Finds or creates a direct (proposal-less) conversation between the
 * authenticated client and the given freelancer. Returns the conversation id.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const freelancerId =
      typeof body?.freelancerId === 'number' ? body.freelancerId : null;

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 },
      );
    }

    const clientId = session.user.id;

    if (clientId === freelancerId) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 },
      );
    }

    // Verify the freelancer exists
    const users = await sql<{ id: number }[]>`
      SELECT id FROM users WHERE id = ${freelancerId} LIMIT 1
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for existing direct conversation (either direction)
    const existing = await sql<{ id: string }[]>`
      SELECT id::text FROM conversations
      WHERE proposal_id IS NULL
        AND (
          (client_id = ${clientId} AND freelancer_id = ${freelancerId})
          OR (client_id = ${freelancerId} AND freelancer_id = ${clientId})
        )
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ conversationId: existing[0].id });
    }

    // Also check if they already have a proposal-based conversation
    const proposalConv = await sql<{ id: string }[]>`
      SELECT c.id::text
      FROM conversations c
      JOIN proposals p ON p.id = c.proposal_id
      JOIN jobs j ON j.id = p.job_id
      WHERE (p.freelancer_id = ${freelancerId} AND j.client_id = ${clientId})
         OR (p.freelancer_id = ${clientId} AND j.client_id = ${freelancerId})
      ORDER BY c.created_at DESC
      LIMIT 1
    `;

    if (proposalConv.length > 0) {
      return NextResponse.json({ conversationId: proposalConv[0].id });
    }

    // Create new direct conversation
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO conversations (client_id, freelancer_id)
      VALUES (${clientId}, ${freelancerId})
      RETURNING id::text
    `;

    return NextResponse.json({ conversationId: row.id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/conversations/direct]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
