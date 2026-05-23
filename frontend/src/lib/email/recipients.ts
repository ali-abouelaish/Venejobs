import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { sql } from '@/lib/db';
import { roles, users } from '@/lib/db/schema';
import { serviceOrders, services } from '@/lib/db/schema/services';
import { fetchFullContract } from '@/lib/contracts';

export interface UserContact {
  id: number;
  email: string;
  name: string;
  lastname: string | null;
}

/**
 * Resolves admin email recipients dynamically from the DB. Returns every
 * user whose role is 'admin', survives staff turnover and supports
 * multiple admins. Caller is responsible for handling the empty case
 * (no admins → no email sent, just a warn log).
 */
export async function getAdminContacts(): Promise<UserContact[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      lastname: users.lastname,
    })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(eq(roles.name, 'admin'));
  return rows;
}

export async function getUserContact(userId: number): Promise<UserContact | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      lastname: users.lastname,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export interface ServiceContext {
  id: string;
  title: string;
  freelancer: UserContact;
}

export async function getServiceContext(serviceId: string): Promise<ServiceContext | null> {
  const rows = await db
    .select({
      id: services.id,
      title: services.title,
      freelancerId: users.id,
      freelancerEmail: users.email,
      freelancerName: users.name,
      freelancerLastname: users.lastname,
    })
    .from(services)
    .innerJoin(users, eq(users.id, services.freelancerId))
    .where(eq(services.id, serviceId))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    freelancer: {
      id: r.freelancerId,
      email: r.freelancerEmail,
      name: r.freelancerName,
      lastname: r.freelancerLastname,
    },
  };
}

export interface OrderContext {
  id: string;
  state: string;
  basePrice: number;
  currency: string;
  client: UserContact;
  freelancer: UserContact;
  service: { id: string; title: string };
}

/**
 * Returns everything needed to compose any order-related notification
 * email: the order, client and freelancer contacts, and the service
 * title. Two queries: one to load order+service, one to fetch both user
 * rows in a single `IN` lookup.
 */
export async function getOrderContext(orderId: string): Promise<OrderContext | null> {
  const orderRows = await db
    .select({
      id: serviceOrders.id,
      state: serviceOrders.state,
      basePrice: serviceOrders.basePrice,
      currency: serviceOrders.currency,
      clientId: serviceOrders.clientId,
      freelancerId: serviceOrders.freelancerId,
      serviceId: services.id,
      serviceTitle: services.title,
    })
    .from(serviceOrders)
    .innerJoin(services, eq(services.id, serviceOrders.serviceId))
    .where(eq(serviceOrders.id, orderId))
    .limit(1);

  const o = orderRows[0];
  if (!o) return null;

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      lastname: users.lastname,
    })
    .from(users)
    .where(inArray(users.id, [o.clientId, o.freelancerId]));

  const client = userRows.find((u) => u.id === o.clientId);
  const freelancer = userRows.find((u) => u.id === o.freelancerId);
  if (!client || !freelancer) return null;

  return {
    id: o.id,
    state: o.state,
    basePrice: o.basePrice,
    currency: o.currency,
    client,
    freelancer,
    service: { id: o.serviceId, title: o.serviceTitle },
  };
}

export interface ContractContext {
  id: string;
  title: string;
  status: string;
  conversationId: string;
  createdBy: number;
  client: UserContact;
  freelancer: UserContact;
}

/**
 * Bundles everything an email orchestrator needs about a contract:
 * the current title (from the current revision), the conversation id
 * for deep-linking, and resolved contact rows for both parties.
 *
 * Reuses fetchFullContract (which already joins through conversation
 * → proposal → job to derive participants) instead of re-implementing
 * the lookup.
 */
export async function getContractContext(
  contractId: string,
): Promise<ContractContext | null> {
  const contract = await fetchFullContract(contractId);
  if (!contract) return null;
  if (!contract.clientId || !contract.freelancerId) return null;

  const [client, freelancer] = await Promise.all([
    getUserContact(contract.clientId),
    getUserContact(contract.freelancerId),
  ]);
  if (!client || !freelancer) return null;

  return {
    id: contract.id,
    title: contract.currentRevision?.title ?? 'Untitled contract',
    status: contract.status,
    conversationId: contract.conversationId,
    createdBy: contract.createdBy,
    client,
    freelancer,
  };
}

/**
 * Returns the OTHER participant on a conversation (i.e. not the sender).
 * Resolves participants via proposal→job for proposal-bound conversations,
 * falling back to the conversation's own client_id/freelancer_id columns
 * for direct conversations. Mirrors the participant logic in
 * GET /api/conversations/[id]/messages.
 */
export async function getConversationRecipient(
  conversationId: string,
  senderId: number,
): Promise<UserContact | null> {
  const rows = await sql<{
    client_id: number | null;
    freelancer_id: number | null;
  }[]>`
    SELECT
      COALESCE(j.client_id, c.client_id)         AS client_id,
      COALESCE(p.freelancer_id, c.freelancer_id) AS freelancer_id
    FROM conversations c
    LEFT JOIN proposals p ON p.id = c.proposal_id
    LEFT JOIN jobs j      ON j.id = p.job_id
    WHERE c.id = ${conversationId}::uuid
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;

  let recipientId: number | null = null;
  if (row.client_id === senderId) recipientId = row.freelancer_id;
  else if (row.freelancer_id === senderId) recipientId = row.client_id;
  if (recipientId === null) return null;

  return getUserContact(recipientId);
}

export function formatMoney(amount: number, currency: string): string {
  // Stripe amounts are in the smallest currency unit (pence/cents).
  const major = (amount / 100).toFixed(2);
  return `${currency.toUpperCase()} ${major}`;
}
