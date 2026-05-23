import { sql } from '@/lib/db';
import { broadcastToWs } from '@/lib/ws';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContractRevision {
  id: string;
  contractId: string;
  proposedBy: number;
  proposedByName: string;
  revisionNumber: number;
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  paymentTerms: string;
  additionalTerms: string | null;
  changeSummary: string | null;
  createdAt: string;
}

export interface ContractSignature {
  userId: number;
  typedName: string;
  signedAt: string;
}

export type ContractPaymentState =
  | 'paid'
  | 'delivered'
  | 'accepted'
  | 'auto_accepted'
  | 'completed'
  | 'disputed'
  | 'refunded';

export interface ContractOpenDispute {
  id: string;
  raisedBy: number;
  raisedByName: string;
  reason: string;
  createdAt: string;
}

export interface ContractPayment {
  state: ContractPaymentState;
  amount: number;
  currency: string;
  paidAt: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
  autoAcceptDeadline: string | null;
  openDispute: ContractOpenDispute | null;
}

export interface Contract {
  id: string;
  conversationId: string;
  createdBy: number;
  createdByName: string;
  clientId: number;
  freelancerId: number;
  status: string;
  messageId: string | null;
  currentRevision: ContractRevision | null;
  revisionHistory: ContractRevision[];
  signatures: ContractSignature[];
  payment: ContractPayment | null;
  freelancerConnectReady: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Fetch full contract ────────────────────────────────────────────────────

export async function fetchFullContract(contractId: string): Promise<Contract | null> {
  // Base contract
  const contracts = await sql<{
    id: string;
    conversation_id: string;
    created_by: number;
    created_by_name: string;
    status: string;
    current_revision_id: string | null;
    message_id: string | null;
    created_at: string;
    updated_at: string;
  }[]>`
    SELECT
      c.id::text,
      c.conversation_id::text,
      c.created_by,
      u.name AS created_by_name,
      c.status::text,
      c.current_revision_id::text,
      c.message_id::text,
      c.created_at,
      c.updated_at
    FROM contracts c
    JOIN users u ON u.id = c.created_by
    WHERE c.id = ${contractId}::uuid
  `;

  if (contracts.length === 0) return null;
  const row = contracts[0];

  // All revisions (newest first)
  const revisions = await sql<{
    id: string;
    contract_id: string;
    proposed_by: number;
    proposed_by_name: string;
    revision_number: number;
    title: string;
    scope: string;
    deliverables: string;
    price: string;
    currency: string;
    deadline: string;
    payment_terms: string;
    additional_terms: string | null;
    change_summary: string | null;
    created_at: string;
  }[]>`
    SELECT
      cr.id::text,
      cr.contract_id::text,
      cr.proposed_by,
      u.name AS proposed_by_name,
      cr.revision_number,
      cr.title,
      cr.scope,
      cr.deliverables,
      cr.price::text,
      cr.currency,
      cr.deadline::text,
      cr.payment_terms,
      cr.additional_terms,
      cr.change_summary,
      cr.created_at
    FROM contract_revisions cr
    JOIN users u ON u.id = cr.proposed_by
    WHERE cr.contract_id = ${contractId}::uuid
    ORDER BY cr.revision_number DESC
  `;

  // Signatures
  const signatures = await sql<{
    user_id: number;
    typed_name: string;
    signed_at: string;
  }[]>`
    SELECT user_id, typed_name, signed_at
    FROM contract_signatures
    WHERE contract_id = ${contractId}::uuid
    ORDER BY signed_at ASC
  `;

  const currentRevision = revisions.find((r) => r.id === row.current_revision_id) ?? null;

  // Conversation participants — needed both for permission checks in the
  // UI and to read the freelancer's Connect readiness flag below.
  const participantRows = await sql<{ freelancer_id: number; client_id: number }[]>`
    SELECT p.freelancer_id, j.client_id
    FROM conversations c
    JOIN proposals p ON p.id = c.proposal_id
    JOIN jobs j ON j.id = p.job_id
    WHERE c.id = ${row.conversation_id}::uuid
    LIMIT 1
  `;
  const freelancerId = participantRows[0]?.freelancer_id ?? 0;
  const clientId = participantRows[0]?.client_id ?? 0;

  // Latest order, if any. Mirrors the UNIQUE(contract_id) on
  // contract_orders — there can be at most one row per contract, but the
  // state walks paid → delivered → accepted | auto_accepted → completed
  // as the work flows. UI reads `state` to pick the right surface.
  const paymentRows = await sql<{
    id: string;
    state: string;
    amount: number;
    currency: string;
    paid_at: string;
    delivered_at: string | null;
    accepted_at: string | null;
    auto_accept_deadline: string | null;
  }[]>`
    SELECT
      id::text,
      state,
      amount,
      currency,
      created_at AS paid_at,
      delivered_at,
      accepted_at,
      auto_accept_deadline
    FROM contract_orders
    WHERE contract_id = ${contractId}::uuid
    LIMIT 1
  `;

  let openDispute: ContractOpenDispute | null = null;
  if (paymentRows.length > 0 && paymentRows[0].state === 'disputed') {
    const disputeRows = await sql<{
      id: string;
      raised_by: number;
      raised_by_name: string;
      reason: string;
      created_at: string;
    }[]>`
      SELECT
        d.id::text,
        d.raised_by,
        u.name AS raised_by_name,
        d.reason,
        d.created_at
      FROM contract_order_disputes d
      JOIN users u ON u.id = d.raised_by
      WHERE d.contract_order_id = ${paymentRows[0].id}::uuid
        AND d.resolution IS NULL
      ORDER BY d.created_at ASC
      LIMIT 1
    `;
    if (disputeRows.length > 0) {
      openDispute = {
        id: disputeRows[0].id,
        raisedBy: disputeRows[0].raised_by,
        raisedByName: disputeRows[0].raised_by_name,
        reason: disputeRows[0].reason,
        createdAt: disputeRows[0].created_at,
      };
    }
  }

  const payment: ContractPayment | null =
    paymentRows.length === 0
      ? null
      : {
          state: paymentRows[0].state as ContractPaymentState,
          amount: paymentRows[0].amount,
          currency: paymentRows[0].currency,
          paidAt: paymentRows[0].paid_at,
          deliveredAt: paymentRows[0].delivered_at,
          acceptedAt: paymentRows[0].accepted_at,
          autoAcceptDeadline: paymentRows[0].auto_accept_deadline,
          openDispute,
        };

  // Cached Connect readiness for the UI. The checkout route still
  // live-syncs before creating a session, so a stale 'true' here can
  // never silently let us charge an unpayable freelancer.
  const connectRows = await sql<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
  }[]>`
    SELECT charges_enabled, payouts_enabled
    FROM stripe_connect_accounts
    WHERE user_id = ${freelancerId}
    LIMIT 1
  `;
  const freelancerConnectReady =
    connectRows.length > 0 &&
    connectRows[0].charges_enabled &&
    connectRows[0].payouts_enabled;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    clientId,
    freelancerId,
    status: row.status,
    messageId: row.message_id,
    currentRevision: currentRevision ? shapeRevision(currentRevision) : null,
    revisionHistory: revisions.map(shapeRevision),
    signatures: signatures.map((s) => ({
      userId: s.user_id,
      typedName: s.typed_name,
      signedAt: s.signed_at,
    })),
    payment,
    freelancerConnectReady,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeRevision(r: {
  id: string;
  contract_id: string;
  proposed_by: number;
  proposed_by_name: string;
  revision_number: number;
  title: string;
  scope: string;
  deliverables: string;
  price: string;
  currency: string;
  deadline: string;
  payment_terms: string;
  additional_terms: string | null;
  change_summary: string | null;
  created_at: string;
}): ContractRevision {
  return {
    id: r.id,
    contractId: r.contract_id,
    proposedBy: r.proposed_by,
    proposedByName: r.proposed_by_name,
    revisionNumber: r.revision_number,
    title: r.title,
    scope: r.scope,
    deliverables: r.deliverables,
    price: r.price,
    currency: r.currency,
    deadline: r.deadline,
    paymentTerms: r.payment_terms,
    additionalTerms: r.additional_terms,
    changeSummary: r.change_summary,
    createdAt: r.created_at,
  };
}

// ─── WS broadcast helper ────────────────────────────────────────────────────

export async function broadcastContract(
  conversationId: string,
  type: 'new_contract' | 'contract_updated',
  contract: Contract,
): Promise<void> {
  await broadcastToWs(conversationId, { type, conversationId, contract });
}

// ─── Get both conversation participant IDs ──────────────────────────────────

export async function getConversationParticipants(
  conversationId: string,
): Promise<{ freelancerId: number; clientId: number } | null> {
  const rows = await sql<{ freelancer_id: number; client_id: number }[]>`
    SELECT p.freelancer_id, j.client_id
    FROM conversations c
    JOIN proposals p ON p.id = c.proposal_id
    JOIN jobs j ON j.id = p.job_id
    WHERE c.id = ${conversationId}::uuid
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { freelancerId: rows[0].freelancer_id, clientId: rows[0].client_id };
}
