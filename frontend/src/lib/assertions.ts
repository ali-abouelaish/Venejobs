import { sql } from '@/lib/db';

/**
 * Returns true if userId is either the freelancer on the proposal,
 * the client on the job linked to this conversation, or a participant
 * in a direct (proposal-less) conversation.
 */
export async function assertConversationAccess(
  conversationId: string,
  userId: number,
): Promise<boolean> {
  const rows = await sql`
    SELECT c.id
    FROM conversations c
    LEFT JOIN proposals p ON p.id = c.proposal_id
    LEFT JOIN jobs j ON j.id = p.job_id
    WHERE c.id = ${conversationId}
      AND (
        p.freelancer_id = ${userId}
        OR j.client_id = ${userId}
        OR c.client_id = ${userId}
        OR c.freelancer_id = ${userId}
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

export interface JobOwnershipRow {
  id: number;
  client_id: number;
  status: string;
}

/**
 * Returns the job row when userId is the client who owns it, else null.
 * Use in client-facing job management routes.
 */
export async function assertJobOwnership(
  jobId: number,
  userId: number,
): Promise<JobOwnershipRow | null> {
  const rows = await sql<JobOwnershipRow[]>`
    SELECT id, client_id, status
    FROM jobs
    WHERE id = ${jobId} AND client_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export interface ProposalClientAccessRow {
  id: number;
  job_id: number;
  freelancer_id: number;
  status: string;
}

/**
 * Returns the proposal row when userId is the client on the job that
 * owns this proposal, else null. Use in proposal accept / decline routes
 * where the acting user must be the hiring client.
 */
export async function assertProposalClientAccess(
  proposalId: number,
  userId: number,
): Promise<ProposalClientAccessRow | null> {
  const rows = await sql<ProposalClientAccessRow[]>`
    SELECT p.id, p.job_id, p.freelancer_id, p.status
    FROM proposals p
    JOIN jobs j ON j.id = p.job_id
    WHERE p.id = ${proposalId} AND j.client_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
