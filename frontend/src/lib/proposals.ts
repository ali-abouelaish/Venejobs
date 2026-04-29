import { sql } from '@/lib/db';

export interface MyProposalForJob {
  id: number;
  status: string;
  proposedAmount: string;
  estimatedDuration: string;
  createdAt: string;
  conversationId: string | null;
}

export async function getMyProposalForJob(
  userId: number,
  jobId: number,
): Promise<MyProposalForJob | null> {
  const rows = await sql<
    {
      id: number;
      status: string;
      proposed_amount: string;
      estimated_duration: string;
      created_at: string;
      conversation_id: string | null;
    }[]
  >`
    SELECT
      p.id,
      p.status,
      p.proposed_amount,
      p.estimated_duration,
      p.created_at,
      c.id AS conversation_id
    FROM proposals p
    LEFT JOIN conversations c ON c.proposal_id = p.id
    WHERE p.job_id = ${jobId} AND p.freelancer_id = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;

  let conversationId = row.conversation_id;
  if (!conversationId) {
    const [conv] = await sql<{ id: string }[]>`
      INSERT INTO conversations (proposal_id)
      VALUES (${row.id})
      RETURNING id
    `;
    conversationId = conv.id;
  }

  return {
    id: row.id,
    status: row.status,
    proposedAmount: row.proposed_amount,
    estimatedDuration: row.estimated_duration,
    createdAt: row.created_at,
    conversationId,
  };
}

export async function getJobProposalCount(jobId: number): Promise<number> {
  const rows = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM proposals WHERE job_id = ${jobId}
  `;
  return Number(rows[0]?.count ?? '0');
}
