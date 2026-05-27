import { and, eq } from 'drizzle-orm';
import { sql } from '@/lib/db';
import { db } from '@/lib/db/drizzle';
import { roles, users } from '@/lib/db/schema';
import { serviceOrders, services } from '@/lib/db/schema/services';

/**
 * Returns true if userId is either the freelancer on the proposal,
 * the client on the job linked to this conversation, or a participant
 * in a direct (proposal-less) conversation. Admins are allowed through
 * so dispute-handling routes can surface the chat as evidence.
 */
export async function assertConversationAccess(
  conversationId: string,
  userId: number,
): Promise<boolean> {
  if (await assertAdminAccess(userId)) return true;
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

export interface ServiceAccessRow {
  id: string;
  freelancerId: number;
  status: string;
  rejectionReason: string | null;
}

/**
 * Returns key fields of the service row when userId is the freelancer
 * who owns it, else null. Status is returned so callers can gate edits
 * by state (e.g. only allow edits in 'draft' or 'rejected').
 */
export async function assertServiceAccess(
  serviceId: string,
  userId: number,
): Promise<ServiceAccessRow | null> {
  const rows = await db
    .select({
      id: services.id,
      freelancerId: services.freelancerId,
      status: services.status,
      rejectionReason: services.rejectionReason,
    })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.freelancerId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export type ServiceOrderRow = typeof serviceOrders.$inferSelect;

/**
 * Returns the service_order row when userId is the participant in the
 * given role (client or freelancer), else null. Use to gate any
 * service-order endpoint where the acting user must be one of the two
 * named participants.
 */
export async function assertServiceOrderAccess(
  orderId: string,
  userId: number,
  role: 'client' | 'freelancer',
): Promise<ServiceOrderRow | null> {
  const column = role === 'client' ? serviceOrders.clientId : serviceOrders.freelancerId;
  const rows = await db
    .select()
    .from(serviceOrders)
    .where(and(eq(serviceOrders.id, orderId), eq(column, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Returns the service_order row plus the caller's derived role when
 * userId is either the client or the freelancer on the order, else null.
 * Use when the route does not know the caller's role up-front (e.g.
 * reviews, where either party can act). Does NOT check order state —
 * callers gate on state themselves.
 */
export async function assertServiceOrderParticipant(
  orderId: string,
  userId: number,
): Promise<{ row: ServiceOrderRow; role: 'client' | 'freelancer' } | null> {
  const rows = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.id, orderId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.clientId === userId) return { row, role: 'client' };
  if (row.freelancerId === userId) return { row, role: 'freelancer' };
  return null;
}

/**
 * Returns true if the user's role is 'admin'. Use to gate /api/admin/*
 * routes. Checks live (no caching) so role revocations take effect on
 * the next request.
 */
export async function assertAdminAccess(userId: number): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(and(eq(users.id, userId), eq(roles.name, 'admin')))
    .limit(1);
  return rows.length > 0;
}
