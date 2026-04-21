import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

/**
 * GET /api/contracts/my
 * Returns all contracts where the current user is a participant
 * (either via a proposal-based conversation or a direct conversation).
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const rows = await sql<{
    id: string;
    status: string;
    title: string;
    price: string;
    currency: string;
    deadline: string;
    created_at: string;
    updated_at: string;
    other_name: string;
    other_id: number | null;
    conversation_id: string;
    job_title: string;
  }[]>`
    SELECT
      ct.id::text,
      ct.status::text,
      cr.title,
      cr.price::text,
      cr.currency,
      cr.deadline::text,
      ct.created_at,
      ct.updated_at,
      other_user.name AS other_name,
      other_user.id AS other_id,
      ct.conversation_id::text,
      COALESCE(j.title, 'Direct contract') AS job_title
    FROM contracts ct
    JOIN conversations conv ON conv.id = ct.conversation_id
    LEFT JOIN proposals p ON p.id = conv.proposal_id
    LEFT JOIN jobs j ON j.id = p.job_id
    LEFT JOIN contract_revisions cr ON cr.id = ct.current_revision_id
    -- Determine the other participant
    LEFT JOIN users other_user ON other_user.id = CASE
      -- proposal-based: if I'm the freelancer, other is the client, and vice versa
      WHEN p.freelancer_id = ${userId} THEN j.client_id
      WHEN j.client_id = ${userId} THEN p.freelancer_id
      -- direct conversation
      WHEN conv.client_id = ${userId} THEN conv.freelancer_id
      WHEN conv.freelancer_id = ${userId} THEN conv.client_id
      ELSE NULL
    END
    WHERE
      p.freelancer_id = ${userId}
      OR j.client_id = ${userId}
      OR conv.client_id = ${userId}
      OR conv.freelancer_id = ${userId}
    ORDER BY ct.updated_at DESC
  `;

  return NextResponse.json({ contracts: rows });
}
